package com.raosons.munim.service;

import com.raosons.munim.domain.*;
import com.raosons.munim.dto.*;
import com.raosons.munim.exception.NotFoundException;
import com.raosons.munim.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * One purchasing agent at the counter: creates sessions and assembles the
 * full state view (cart + current quote + current mandate + current
 * payment) that every mutating endpoint returns, mirroring the slice of
 * MunimState the front-end rendered.
 */
@Service
public class SessionService {

    private final ShopSessionRepository sessionRepository;
    private final CartLineRepository cartLineRepository;
    private final ProductRepository productRepository;
    private final QuoteSnapshotRepository quoteSnapshotRepository;
    private final MandateRepository mandateRepository;
    private final PaymentRepository paymentRepository;
    private final Clock shopClock;

    public SessionService(
        ShopSessionRepository sessionRepository,
        CartLineRepository cartLineRepository,
        ProductRepository productRepository,
        QuoteSnapshotRepository quoteSnapshotRepository,
        MandateRepository mandateRepository,
        PaymentRepository paymentRepository,
        Clock shopClock
    ) {
        this.sessionRepository = sessionRepository;
        this.cartLineRepository = cartLineRepository;
        this.productRepository = productRepository;
        this.quoteSnapshotRepository = quoteSnapshotRepository;
        this.mandateRepository = mandateRepository;
        this.paymentRepository = paymentRepository;
        this.shopClock = shopClock;
    }

    @Transactional
    public ShopSession createSession(String buyerName) {
        ShopSession session = ShopSession.builder()
            .id(UUID.randomUUID())
            .buyerName(buyerName == null ? "" : buyerName)
            .createdAt(Instant.now(shopClock))
            .build();
        return sessionRepository.save(session);
    }

    public ShopSession requireSession(UUID id) {
        return sessionRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("No such session " + id + ". Start one with POST /api/sessions."));
    }

    @Transactional
    public ShopSession setBuyerName(UUID id, String buyerName) {
        ShopSession session = requireSession(id);
        session.setBuyerName(buyerName);
        return sessionRepository.save(session);
    }

    @Transactional
    public SessionStateDto toStateDto(ShopSession session) {
        List<CartLineDto> cart = cartLineRepository.findBySessionIdOrderByIdAsc(session.getId()).stream()
            .map(line -> {
                Product product = productRepository.findById(line.getSku()).orElse(null);
                String name = product != null ? product.getName() : line.getSku();
                return new CartLineDto(line.getSku(), name, line.getQty(), line.getUnitPaiseAtAdd(), line.getGstPctAtAdd(), line.getNote());
            })
            .toList();

        QuoteDto quote = session.getCurrentQuoteId() == null ? null :
            quoteSnapshotRepository.findById(session.getCurrentQuoteId()).map(EntityMappers::toDto).orElse(null);

        MandateDto mandate = session.getCurrentMandateId() == null ? null :
            mandateRepository.findById(session.getCurrentMandateId()).map(EntityMappers::toDto).orElse(null);

        PaymentDto payment = session.getCurrentPaymentId() == null ? null :
            paymentRepository.findById(session.getCurrentPaymentId()).map(EntityMappers::toDto).orElse(null);

        return new SessionStateDto(session.getId(), session.getBuyerName(), session.getCreatedAt(), cart, quote, mandate, payment);
    }
}
