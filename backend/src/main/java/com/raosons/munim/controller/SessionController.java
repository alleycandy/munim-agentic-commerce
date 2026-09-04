package com.raosons.munim.controller;

import com.raosons.munim.domain.ShopSession;
import com.raosons.munim.dto.*;
import com.raosons.munim.service.CartService;
import com.raosons.munim.service.EngineService;
import com.raosons.munim.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final CartService cartService;
    private final EngineService engineService;

    public SessionController(SessionService sessionService, CartService cartService, EngineService engineService) {
        this.sessionService = sessionService;
        this.cartService = cartService;
        this.engineService = engineService;
    }

    @PostMapping
    public ResponseEntity<SessionStateDto> createSession(@RequestBody(required = false) CreateSessionRequest request) {
        String buyerName = request == null ? null : request.buyerName();
        ShopSession session = sessionService.createSession(buyerName);
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.toStateDto(session));
    }

    @GetMapping("/{id}")
    public SessionStateDto getSession(@PathVariable UUID id) {
        return sessionService.toStateDto(sessionService.requireSession(id));
    }

    @PatchMapping("/{id}/buyer-name")
    public SessionStateDto setBuyerName(@PathVariable UUID id, @Valid @RequestBody SetBuyerNameRequest request) {
        ShopSession session = sessionService.setBuyerName(id, request.buyerName());
        return sessionService.toStateDto(session);
    }

    // -------------------------------------------------------------- cart

    @GetMapping("/{id}/cart")
    public SessionStateDto getCart(@PathVariable UUID id) {
        return sessionService.toStateDto(sessionService.requireSession(id));
    }

    @PostMapping("/{id}/cart/lines")
    public EngineResultDto addLine(@PathVariable UUID id, @Valid @RequestBody AddCartLineRequest request) {
        ShopSession session = sessionService.requireSession(id);
        String note = cartService.addLine(session, request.sku(), request.qty(), request.note());
        return new EngineResultDto(List.of(note), sessionService.toStateDto(session));
    }

    @DeleteMapping("/{id}/cart/lines/{sku}")
    public EngineResultDto removeLine(@PathVariable UUID id, @PathVariable String sku) {
        ShopSession session = sessionService.requireSession(id);
        cartService.removeLine(session, sku);
        return new EngineResultDto(List.of("Removed " + sku + "."), sessionService.toStateDto(session));
    }

    @DeleteMapping("/{id}/cart")
    public EngineResultDto clearCart(@PathVariable UUID id) {
        ShopSession session = sessionService.requireSession(id);
        cartService.clearCart(session);
        return new EngineResultDto(List.of("Chit cleared."), sessionService.toStateDto(session));
    }

    // ------------------------------------------------------------- quote

    @PostMapping("/{id}/quote")
    public EngineResultDto quote(@PathVariable UUID id) {
        ShopSession session = sessionService.requireSession(id);
        QuoteDto quote = engineService.runQuote(session);
        List<String> notes = new java.util.ArrayList<>(quote.warnings());
        notes.addAll(quote.blockers());
        return new EngineResultDto(notes, sessionService.toStateDto(session));
    }

    // ----------------------------------------------------------- mandate

    @PostMapping("/{id}/mandate")
    public EngineResultDto requestMandate(@PathVariable UUID id, @Valid @RequestBody RequestMandateRequest request) {
        ShopSession session = sessionService.requireSession(id);
        MandateDto mandate = engineService.requestMandate(session, request.purpose());
        return new EngineResultDto(List.of(mandate.reason()), sessionService.toStateDto(session));
    }

    @PostMapping("/{id}/mandate/{mandateId}/approve")
    public EngineResultDto approveMandate(@PathVariable UUID id, @PathVariable UUID mandateId) {
        ShopSession session = sessionService.requireSession(id);
        MandateDto mandate = engineService.approveMandate(session, mandateId);
        return new EngineResultDto(List.of(mandate.reason()), sessionService.toStateDto(session));
    }

    // ----------------------------------------------------------- payment

    @PostMapping("/{id}/capture")
    public EngineResultDto capture(@PathVariable UUID id) {
        ShopSession session = sessionService.requireSession(id);
        PaymentDto payment = engineService.capture(session);
        String note = payment.status().equals("captured")
            ? "Captured " + payment.amountPaise() + " paise via agent mandate"
            : payment.failureMessage();
        return new EngineResultDto(List.of(note), sessionService.toStateDto(session));
    }

    @PostMapping("/{id}/capture/retry")
    public EngineResultDto retry(@PathVariable UUID id) {
        ShopSession session = sessionService.requireSession(id);
        PaymentDto payment = engineService.capture(session);
        String note = payment.status().equals("captured")
            ? "Captured " + payment.amountPaise() + " paise via agent mandate"
            : payment.failureMessage();
        return new EngineResultDto(List.of(note), sessionService.toStateDto(session));
    }
}
