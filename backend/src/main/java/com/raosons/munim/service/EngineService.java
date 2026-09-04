package com.raosons.munim.service;

import com.raosons.munim.domain.*;
import com.raosons.munim.domain.enums.*;
import com.raosons.munim.dto.MandateDto;
import com.raosons.munim.dto.PaymentDto;
import com.raosons.munim.dto.QuoteDto;
import com.raosons.munim.exception.EngineException;
import com.raosons.munim.exception.NotFoundException;
import com.raosons.munim.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EngineService {


private final CartLineRepository cartLineRepository;
private final ProductRepository productRepository;
private final QuoteSnapshotRepository quoteSnapshotRepository;
private final MandateRepository mandateRepository;
private final PaymentRepository paymentRepository;
private final ShopOrderRepository shopOrderRepository;
private final ShopSessionRepository sessionRepository;
private final PolicyService policyService;
private final AuditService auditService;
private final java.time.Clock shopClock;
private final ZoneId shopZoneId;

public EngineService(
    CartLineRepository cartLineRepository,
    ProductRepository productRepository,
    QuoteSnapshotRepository quoteSnapshotRepository,
    MandateRepository mandateRepository,
    PaymentRepository paymentRepository,
    ShopOrderRepository shopOrderRepository,
    ShopSessionRepository sessionRepository,
    PolicyService policyService,
    AuditService auditService,
    java.time.Clock shopClock,
    ZoneId shopZoneId
) {
    this.cartLineRepository = cartLineRepository;
    this.productRepository = productRepository;
    this.quoteSnapshotRepository = quoteSnapshotRepository;
    this.mandateRepository = mandateRepository;
    this.paymentRepository = paymentRepository;
    this.shopOrderRepository = shopOrderRepository;
    this.sessionRepository = sessionRepository;
    this.policyService = policyService;
    this.auditService = auditService;
    this.shopClock = shopClock;
    this.shopZoneId = shopZoneId;
}

// ---------------------------------------------------------------- quote

@Transactional
public QuoteDto runQuote(ShopSession session) {
    QuoteSnapshot quote = quoteCartInternal(session);
    return EntityMappers.toDto(quote);
}

private QuoteSnapshot quoteCartInternal(ShopSession session) {

    Policy policy = policyService.getPolicyEntity();

    List<CartLine> cartLines =
        cartLineRepository.findBySessionIdOrderByIdAsc(session.getId());

    Instant startOfDay =
        LocalDate.now(shopClock)
            .atStartOfDay(shopZoneId)
            .toInstant();

    long dailySpendPaise =
        shopOrderRepository.sumPaidSince(startOfDay);

    List<String> warnings = new ArrayList<>();
    List<String> blockers = new ArrayList<>();
    List<QuoteLine> hydrated = new ArrayList<>();

    for (CartLine line : cartLines) {

        Product product =
            productRepository.findById(line.getSku()).orElse(null);

        if (product == null) {
            blockers.add(
                "Unknown SKU " + line.getSku() + "."
            );
            continue;
        }

        if (line.getQty() <= 0) {
            blockers.add(
                product.getName()
                    + ": quantity must be at least 1."
            );
            continue;
        }

        if (line.getQty() > product.getStock()) {
            blockers.add(
                product.getName()
                    + ": asked for "
                    + line.getQty()
                    + " "
                    + product.getPackUnit()
                    + ", only "
                    + product.getStock()
                    + " on the shelf."
            );
        }

        if (
            policy.getBlockedCategories()
                .contains(product.getCategory())
        ) {
            blockers.add(
                product.getName()
                    + " is in a blocked category ("
                    + product.getCategory()
                        .name()
                        .toLowerCase()
                    + ")."
            );
        }

        if (
            line.getUnitPaiseAtAdd()
                != product.getPricePaise()
        ) {
            warnings.add(
                product.getName()
                    + ": quoted "
                    + MoneyFormatter.plainRupees(
                        line.getUnitPaiseAtAdd()
                    )
                    + " but the book says "
                    + MoneyFormatter.plainRupees(
                        product.getPricePaise()
                    )
                    + ". Using the book."
            );
        }

        QuoteLine quoteLine =
            QuoteLine.builder()
                .sku(line.getSku())
                .name(product.getName())
                .qty(line.getQty())
                .unitPaise(product.getPricePaise())
                .gstPct(product.getGstPct())
                .build();

        hydrated.add(quoteLine);
    }

    long subtotalPaise =
        hydrated.stream()
            .mapToLong(
                line ->
                    line.getUnitPaise()
                        * line.getQty()
            )
            .sum();

    long gstPaise =
        hydrated.stream()
            .mapToLong(
                line ->
                    Math.round(
                        (
                            line.getUnitPaise()
                                * (double) line.getQty()
                                * line.getGstPct()
                        )
                        / (100.0 + line.getGstPct())
                    )
            )
            .sum();

    long totalPaise = subtotalPaise;

    String buyerName = session.getBuyerName();

    if (
        (buyerName == null || buyerName.isBlank())
            && policy.isRequireNamedBuyer()
    ) {
        blockers.add(
            "A named buyer is required. Agents must identify the principal."
        );
    }

    if (totalPaise > policy.getMaxOrderPaise()) {
        blockers.add(
            "Order "
                + MoneyFormatter.inr(totalPaise)
                + " is over the shop cap of "
                + MoneyFormatter.inr(
                    policy.getMaxOrderPaise()
                )
                + ". Split it or come to the counter."
        );
    }

    if (
        dailySpendPaise + totalPaise
            > policy.getDailyCapPaise()
    ) {
        blockers.add(
            "This would take today's agent take to "
                + MoneyFormatter.inr(
                    dailySpendPaise + totalPaise
                )
                + ", over the daily cap of "
                + MoneyFormatter.inr(
                    policy.getDailyCapPaise()
                )
                + "."
        );
    }

    if (!policy.isAllowCredit()) {
        warnings.add(
            "No credit. Payment is captured before the bag leaves."
        );
    }

    QuoteSnapshot quote =
        QuoteSnapshot.builder()
            .id(UUID.randomUUID())
            .session(session)
            .subtotalPaise(subtotalPaise)
            .gstPaise(gstPaise)
            .totalPaise(totalPaise)
            .buyerName(buyerName)
            .createdAt(Instant.now(shopClock))
            .warnings(warnings)
            .blockers(blockers)
            .build();

    /*
     * IMPORTANT:
     * Do not use hydrated.forEach(l -> l.setQuote(quote))
     * here because quote is reassigned below.
     *
     * A normal loop avoids the "effectively final" error.
     */
    for (QuoteLine quoteLine : hydrated) {
        quoteLine.setQuote(quote);
    }

    quote.setLines(hydrated);

    quote =
        quoteSnapshotRepository.save(quote);

    session.setCurrentQuoteId(quote.getId());

    sessionRepository.save(session);

    String summary;

    if (blockers.isEmpty()) {
        summary =
            "Quoted "
                + MoneyFormatter.plainRupees(totalPaise)
                + " INR across "
                + hydrated.size()
                + " lines";
    } else {
        summary =
            "Quote blocked: "
                + blockers.get(0);
    }

    Map<String, String> detail =
        new LinkedHashMap<>();

    detail.put(
        "blockers",
        String.valueOf(blockers.size())
    );

    detail.put(
        "warnings",
        String.valueOf(warnings.size())
    );

    auditService.record(
        AuditKind.QUOTE,
        summary,
        totalPaise,
        session.getId(),
        detail
    );

    return quote;
}

// ------------------------------------------------------------- mandate

@Transactional
public MandateDto requestMandate(
    ShopSession session,
    String purpose
) {

    QuoteSnapshot quote;

    if (session.getCurrentQuoteId() != null) {

        quote =
            quoteSnapshotRepository
                .findById(session.getCurrentQuoteId())
                .orElseGet(
                    () -> quoteCartInternal(session)
                );

    } else {

        quote =
            quoteCartInternal(session);
    }

    Policy policy =
        policyService.getPolicyEntity();

    Instant now =
        Instant.now(shopClock);

    String buyer =
        (
            session.getBuyerName() == null
                || session.getBuyerName().isBlank()
        )
            ? "unnamed agent"
            : session.getBuyerName();

    Mandate mandate =
        Mandate.builder()
            .id(UUID.randomUUID())
            .session(session)
            .quoteId(quote.getId())
            .maxPaise(quote.getTotalPaise())
            .purpose(purpose)
            .buyer(buyer)
            .buyerKind(BuyerKind.AGENT)
            .createdAt(now)
            .expiresAt(
                now.plus(
                    policy.getHoldMinutes(),
                    ChronoUnit.MINUTES
                )
            )
            .retries(0)
            .build();

    Map<String, String> detail =
        new LinkedHashMap<>();

    if (!quote.getBlockers().isEmpty()) {

        mandate.setStatus(
            MandateStatus.BLOCKED
        );

        mandate.setReason(
            quote.getBlockers().get(0)
        );

        detail.put(
            "mandateId",
            mandate.getId().toString()
        );

        detail.put(
            "buyer",
            buyer
        );

        auditService.record(
            AuditKind.MANDATE_BLOCK,
            mandate.getReason(),
            quote.getTotalPaise(),
            session.getId(),
            detail
        );

    } else if (
        quote.getTotalPaise()
            <= policy.getAutoApproveBelowPaise()
    ) {

        mandate.setStatus(
            MandateStatus.APPROVED
        );

        mandate.setReason(
            "Within auto-approve bound."
        );

        detail.put(
            "mandateId",
            mandate.getId().toString()
        );

        detail.put(
            "bound",
            String.valueOf(
                policy.getAutoApproveBelowPaise()
            )
        );

        auditService.record(
            AuditKind.MANDATE_APPROVE,
            "Auto-approved "
                + MoneyFormatter.inr(
                    quote.getTotalPaise()
                )
                + " for "
                + buyer,
            quote.getTotalPaise(),
            session.getId(),
            detail
        );

    } else {

        mandate.setStatus(
            MandateStatus.HELD
        );

        mandate.setReason(
            "Over auto-approve ("
                + MoneyFormatter.inr(
                    policy.getAutoApproveBelowPaise()
                )
                + "). Waiting on the gaddi."
        );

        detail.put(
            "mandateId",
            mandate.getId().toString()
        );

        detail.put(
            "buyer",
            buyer
        );

        auditService.record(
            AuditKind.MANDATE_REQUEST,
            mandate.getReason(),
            quote.getTotalPaise(),
            session.getId(),
            detail
        );
    }

    mandate =
        mandateRepository.save(mandate);

    session.setCurrentMandateId(
        mandate.getId()
    );

    sessionRepository.save(session);

    return EntityMappers.toDto(mandate);
}

@Transactional
public MandateDto approveMandate(
    ShopSession session,
    UUID mandateId
) {

    Mandate mandate =
        mandateRepository
            .findById(mandateId)
            .filter(
                mandateRecord ->
                    mandateRecord
                        .getSession()
                        .getId()
                        .equals(session.getId())
            )
            .orElseThrow(
                () ->
                    new NotFoundException(
                        "No such mandate."
                    )
            );

    mandate.setStatus(
        MandateStatus.APPROVED
    );

    mandate.setReason(
        "Approved from the gaddi."
    );

    mandate =
        mandateRepository.save(mandate);

    session.setCurrentMandateId(
        mandate.getId()
    );

    sessionRepository.save(session);

    Map<String, String> detail =
        Map.of(
            "mandateId",
            mandate.getId().toString()
        );

    auditService.record(
        AuditKind.MANDATE_APPROVE,
        "Desk approved "
            + mandate.getId(),
        mandate.getMaxPaise(),
        session.getId(),
        detail
    );

    return EntityMappers.toDto(mandate);
}

// ------------------------------------------------------------- payment

@Transactional
public PaymentDto capture(
    ShopSession session
) {

    if (
        session.getCurrentMandateId() == null
            || session.getCurrentQuoteId() == null
    ) {
        throw new EngineException(
            "Nothing to capture. Quote and mandate first."
        );
    }

    Mandate mandate =
        mandateRepository
            .findById(
                session.getCurrentMandateId()
            )
            .orElseThrow(
                () ->
                    new NotFoundException(
                        "No such mandate."
                    )
            );

    QuoteSnapshot quote =
        quoteSnapshotRepository
            .findById(
                session.getCurrentQuoteId()
            )
            .orElseThrow(
                () ->
                    new NotFoundException(
                        "No such quote."
                    )
            );

    Policy policy =
        policyService.getPolicyEntity();

    long amountPaise =
        quote.getTotalPaise();

    Instant now =
        Instant.now(shopClock);

    Payment payment;

    if (
        mandate.getStatus()
            != MandateStatus.APPROVED
            && mandate.getStatus()
                != MandateStatus.FAILED
    ) {

        payment =
            makePayment(
                mandate,
                amountPaise,
                PaymentStatus.FAILED,
                "mandate_not_approved",
                "Mandate is not approved."
            );

        mandate.setStatus(
            MandateStatus.BLOCKED
        );

        mandate.setReason(
            payment.getFailureMessage()
        );

    } else if (
        now.isAfter(
            mandate.getExpiresAt()
        )
    ) {

        payment =
            makePayment(
                mandate,
                amountPaise,
                PaymentStatus.FAILED,
                "mandate_expired",
                "Mandate expired. Ask again."
            );

        mandate.setStatus(
            MandateStatus.EXPIRED
        );

        mandate.setReason(
            payment.getFailureMessage()
        );

    } else if (
        amountPaise
            > mandate.getMaxPaise()
    ) {

        payment =
            makePayment(
                mandate,
                amountPaise,
                PaymentStatus.FAILED,
                "over_bound",
                "Capture "
                    + amountPaise
                    + " exceeds mandate bound "
                    + mandate.getMaxPaise()
                    + "."
            );

        mandate.setStatus(
            MandateStatus.BLOCKED
        );

        mandate.setReason(
            payment.getFailureMessage()
        );

    } else if (
        mandate.getRetries()
            >= policy.getMaxPaymentRetries()
            && mandate.getStatus()
                == MandateStatus.FAILED
    ) {

        payment =
            makePayment(
                mandate,
                amountPaise,
                PaymentStatus.FAILED,
                "retry_exhausted",
                "One retry already used. Stopping. "
                    + "The bag stays on the counter."
            );

        mandate.setReason(
            payment.getFailureMessage()
        );

    } else if (
        policy.isTripNextPayment()
    ) {

        payment =
            makePayment(
                mandate,
                amountPaise,
                PaymentStatus.FAILED,
                "BAD_REQUEST_ERROR:gateway_error",
                "UPI collect expired at the issuer. "
                    + "The shop does not hammer the customer."
            );

        mandate.setStatus(
            MandateStatus.FAILED
        );

        mandate.setRetries(
            mandate.getRetries() + 1
        );

        mandate.setReason(
            payment.getFailureMessage()
        );

    } else {

        payment =
            makePayment(
                mandate,
                amountPaise,
                PaymentStatus.CAPTURED,
                null,
                null
            );

        mandate.setStatus(
            MandateStatus.CAPTURED
        );

        mandate.setReason(
            "Captured in test mode."
        );
    }

    if (
        policy.isTripNextPayment()
            && payment.getStatus()
                == PaymentStatus.FAILED
    ) {
        policy.setTripNextPayment(false);
    }

    mandate =
        mandateRepository.save(mandate);

    payment =
        paymentRepository.save(payment);

    Map<String, String> detail =
        new LinkedHashMap<>();

    if (
        payment.getStatus()
            == PaymentStatus.CAPTURED
    ) {

        detail.put(
            "paymentId",
            payment.getId()
        );

        detail.put(
            "mandateId",
            mandate.getId().toString()
        );

        detail.put(
            "method",
            payment.getMethod()
                .name()
                .toLowerCase()
        );

        auditService.record(
            AuditKind.PAYMENT_CAPTURE,
            "Captured "
                + MoneyFormatter.plainRupees(
                    payment.getAmountPaise()
                )
                + " INR via agent mandate",
            payment.getAmountPaise(),
            session.getId(),
            detail
        );

    } else {

        detail.put(
            "paymentId",
            payment.getId()
        );

        detail.put(
            "mandateId",
            mandate.getId().toString()
        );

        detail.put(
            "code",
            payment.getFailureCode() == null
                ? "unknown"
                : payment.getFailureCode()
        );

        auditService.record(
            AuditKind.PAYMENT_FAIL,
            payment.getFailureMessage(),
            payment.getAmountPaise(),
            session.getId(),
            detail
        );
    }

    session.setCurrentPaymentId(
        payment.getId()
    );

    session.setCurrentMandateId(
        mandate.getId()
    );

    // ---------------------------------------------------------
    // Successful payment -> create order and reduce stock
    // ---------------------------------------------------------

    if (
        payment.getStatus()
            == PaymentStatus.CAPTURED
    ) {

        String orderBuyer =
            (
                session.getBuyerName() == null
                    || session.getBuyerName().isBlank()
            )
                ? "unnamed agent"
                : session.getBuyerName();

        ShopOrder order =
            ShopOrder.builder()
                .id(UUID.randomUUID())
                .session(session)
                .mandateId(mandate.getId())
                .paymentId(payment.getId())
                .buyer(orderBuyer)
                .totalPaise(
                    quote.getTotalPaise()
                )
                .status(OrderStatus.PAID)
                .createdAt(now)
                .build();

        List<OrderLine> orderLines =
            new ArrayList<>();

        for (
            QuoteLine quoteLine
            : quote.getLines()
        ) {

            OrderLine orderLine =
                OrderLine.builder()
                    .order(order)
                    .sku(quoteLine.getSku())
                    .name(quoteLine.getName())
                    .qty(quoteLine.getQty())
                    .unitPaise(
                        quoteLine.getUnitPaise()
                    )
                    .gstPct(
                        quoteLine.getGstPct()
                    )
                    .build();

            orderLines.add(orderLine);

            /*
             * Normal lookup instead of Optional.ifPresent(...)
             * to avoid lambda capture problems.
             */
            Product product =
                productRepository
                    .findById(quoteLine.getSku())
                    .orElse(null);

            if (product != null) {

                int newStock =
                    Math.max(
                        0,
                        product.getStock()
                            - quoteLine.getQty()
                    );

                product.setStock(newStock);

                productRepository.save(product);
            }
        }

        order.setLines(orderLines);

        shopOrderRepository.save(order);

        cartLineRepository.deleteBySession(
            session
        );
    }

    sessionRepository.save(session);

    return EntityMappers.toDto(payment);
}

// ------------------------------------------------------------- payment helper

private Payment makePayment(
    Mandate mandate,
    long amountPaise,
    PaymentStatus status,
    String failureCode,
    String failureMessage
) {

    String id =
        "pay_test_"
            + UUID.randomUUID()
                .toString()
                .replace("-", "");

    return Payment.builder()
        .id(id)
        .mandate(mandate)
        .amountPaise(amountPaise)
        .method(
            PaymentMethod.AGENT_MANDATE
        )
        .status(status)
        .failureCode(failureCode)
        .failureMessage(failureMessage)
        .createdAt(
            Instant.now(shopClock)
        )
        .build();
}


}
