package com.raosons.munim.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.raosons.munim.domain.CartLine;
import com.raosons.munim.domain.ChatMessage;
import com.raosons.munim.domain.ShopSession;
import com.raosons.munim.domain.enums.ChatRole;
import com.raosons.munim.dto.*;
import com.raosons.munim.repository.CartLineRepository;
import com.raosons.munim.repository.ChatMessageRepository;
import com.raosons.munim.repository.MandateRepository;
import com.raosons.munim.repository.PaymentRepository;
import com.raosons.munim.repository.QuoteSnapshotRepository;
import com.raosons.munim.repository.ShopSessionRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Munim's voice. This is a faithful port of ai.ts's askMunim(): same system
 * prompt, same JSON turn contract, same graceful "the model is not wired in"
 * fallback. Unlike the front-end original, actions the model asks for are
 * applied server-side against the real engine, not trusted at face value -
 * the engine (EngineService) still enforces every rule.
 */
@Service
public class ChatService {

    private final CatalogService catalogService;
    private final SessionService sessionService;
    private final CartService cartService;
    private final EngineService engineService;
    private final ChatMessageRepository chatMessageRepository;
    private final ShopSessionRepository sessionRepository;
    private final CartLineRepository cartLineRepository;
    private final QuoteSnapshotRepository quoteSnapshotRepository;
    private final MandateRepository mandateRepository;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;
    private final Clock shopClock;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

    @Value("${munim.ai.api-key:}")
    private String apiKey;

    @Value("${munim.ai.base-url}")
    private String baseUrl;

    @Value("${munim.ai.model}")
    private String model;

    @Value("${munim.ai.temperature}")
    private double temperature;

    @Value("${munim.ai.max-tokens}")
    private int maxTokens;

    public ChatService(
        CatalogService catalogService,
        SessionService sessionService,
        CartService cartService,
        EngineService engineService,
        ChatMessageRepository chatMessageRepository,
        ShopSessionRepository sessionRepository,
        CartLineRepository cartLineRepository,
        QuoteSnapshotRepository quoteSnapshotRepository,
        MandateRepository mandateRepository,
        PaymentRepository paymentRepository,
        ObjectMapper objectMapper,
        Clock shopClock
    ) {
        this.catalogService = catalogService;
        this.sessionService = sessionService;
        this.cartService = cartService;
        this.engineService = engineService;
        this.chatMessageRepository = chatMessageRepository;
        this.sessionRepository = sessionRepository;
        this.cartLineRepository = cartLineRepository;
        this.quoteSnapshotRepository = quoteSnapshotRepository;
        this.mandateRepository = mandateRepository;
        this.paymentRepository = paymentRepository;
        this.objectMapper = objectMapper;
        this.shopClock = shopClock;
    }

    public List<ChatMessageDto> history(UUID sessionId) {
        return chatMessageRepository.findBySessionIdOrderByAtAsc(sessionId).stream().map(EntityMappers::toDto).toList();
    }

    @Transactional
    public ChatTurnResponse chat(ShopSession session, String text) {
        pushMessage(session, ChatRole.BUYER, text.trim());

        if (apiKey == null || apiKey.isBlank()) {
            return ChatTurnResponse.failure(
                "The counter's language model is not wired in this environment. Run the hotel breakfast script instead - the money engine still works.");
        }

        String system = buildSystemPrompt(session);
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByAtAsc(session.getId());

        try {
            String responseBody = callXai(system, history);
            JsonNode root = objectMapper.readTree(responseBody);
            String raw = root.path("choices").path(0).path("message").path("content").asText("");
            ChatTurnDto turn = parseTurn(raw);
            if (turn == null) {
                return ChatTurnResponse.failure("Munim answered in a shape the book cannot file. Try again, or run the breakfast script.");
            }
            applyTurn(session, turn);
            pushMessage(session, ChatRole.MUNIM, turn.say());
            return ChatTurnResponse.success(turn, sessionService.toStateDto(session));
        } catch (XaiCallException e) {
            return ChatTurnResponse.failure("The counter could not reach the model (" + e.status + "). Try the scripted breakfast order.");
        } catch (Exception e) {
            return ChatTurnResponse.failure("The counter lost the line. Try the breakfast script - the book still works.");
        }
    }

    // ------------------------------------------------------------- prompt

    private String buildSystemPrompt(ShopSession session) {
        List<ProductAgentDto> catalog = catalogService.catalogForAgentsList();
        List<Map<String, Object>> cart = cartLineRepository.findBySessionIdOrderByIdAsc(session.getId()).stream()
            .map(l -> Map.<String, Object>of("sku", l.getSku(), "qty", l.getQty()))
            .toList();

        Long quoteTotalPaise = null;
        List<String> quoteBlockers = List.of();
        if (session.getCurrentQuoteId() != null) {
            var quote = quoteSnapshotRepository.findById(session.getCurrentQuoteId()).orElse(null);
            if (quote != null) {
                quoteTotalPaise = quote.getTotalPaise();
                quoteBlockers = quote.getBlockers();
            }
        }
        String mandateStatus = null;
        if (session.getCurrentMandateId() != null) {
            var mandate = mandateRepository.findById(session.getCurrentMandateId()).orElse(null);
            if (mandate != null) mandateStatus = mandate.getStatus().name().toLowerCase();
        }
        String paymentStatus = null;
        if (session.getCurrentPaymentId() != null) {
            var payment = paymentRepository.findById(session.getCurrentPaymentId()).orElse(null);
            if (payment != null) paymentStatus = payment.getStatus().name().toLowerCase();
        }

        return toJson(catalog, cart, quoteTotalPaise, quoteBlockers, mandateStatus, paymentStatus, session.getBuyerName());
    }

    private String toJson(List<ProductAgentDto> catalog, List<Map<String, Object>> cart, Long quoteTotalPaise,
                           List<String> quoteBlockers, String mandateStatus, String paymentStatus, String buyerName) {
        String catalogJson = writeJson(catalog);
        String cartJson = writeJson(cart);
        String blockersJson = writeJson(quoteBlockers);

        return """
            You are Munim, the person at the counter of Rao & Sons, 14 East Street, Camp, Pune. You used to be a man named Kulkarni. You are now software, but you still sit the way he sat: short sentences, exact numbers, no charm offensive.

            You sell only what is in the catalog. You never invent a price, a stock count, or a SKU. Prices and stock are enforced by a deterministic engine AFTER you speak - if you guess wrong, the engine will correct you. Prefer quoting SKUs you saw in the catalog.

            Voice:
            - Indian English, dry, specific. Occasional Hindi when a regular would (atta, poha, theek hai). Never cartoon Hinglish. Never "Sure! I'd be happy to help!"
            - You address the purchasing agent, not the hotel guest.
            - You disclose substitutions. Silent swaps are theft.
            - You do not haggle below the book price.
            - You never offer credit.

            Money rules you must obey (the engine will also enforce):
            - Named buyer required.
            - No order over the shop cap.
            - Auto-capture only after a mandate is approved.
            - One payment retry, then stop.
            - If stock is short, say so and offer a disclosed substitute.

            You MUST reply with a single JSON object, no markdown, no extra keys:
            {
              "say": "what you say out loud to the agent",
              "buyer_name": "optional, set when they identify the principal",
              "actions": [ /* zero or more, in order */ ]
            }

            Action shapes:
            {"op":"add","sku":"POH-THK-1","qty":6,"note":"optional"}
            {"op":"remove","sku":"POH-THK-1"}
            {"op":"clear"}
            {"op":"quote"}
            {"op":"mandate","purpose":"breakfast dry goods for Hotel Surya"}
            {"op":"capture"}
            {"op":"retry"}

            When the buyer is still browsing, actions can be empty. When they agree to buy, add lines, then quote. When they accept the quote, mandate then capture. Do not capture if the last engine notes said the quote was blocked.

            Catalog (source of truth):
            %s

            Current counter state:
            buyer: %s
            cart: %s
            quote_total_paise: %s
            quote_blockers: %s
            mandate: %s
            payment: %s
            engine_notes: []"""
            .formatted(
                catalogJson,
                (buyerName == null || buyerName.isBlank()) ? "(unnamed)" : buyerName,
                cartJson,
                quoteTotalPaise == null ? "null" : quoteTotalPaise.toString(),
                blockersJson,
                mandateStatus == null ? "null" : mandateStatus,
                paymentStatus == null ? "null" : paymentStatus
            );
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "[]";
        }
    }

    // --------------------------------------------------------------- x.ai

    private String callXai(String system, List<ChatMessage> history) throws Exception {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", system));
        for (ChatMessage m : history) {
            String role = m.getRole() == ChatRole.BUYER ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", m.getText()));
        }

        Map<String, Object> body = Map.of(
            "model", model,
            "temperature", temperature,
            "max_tokens", maxTokens,
            "messages", messages
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl))
            .timeout(Duration.ofSeconds(60))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new XaiCallException(response.statusCode());
        }
        return response.body();
    }

    private static final class XaiCallException extends RuntimeException {
        final int status;
        XaiCallException(int status) { this.status = status; }
    }

    // ------------------------------------------------------------ parsing

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawTurn(String say, String buyer_name, List<RawAction> actions) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawAction(String op, String sku, Integer qty, String note, String purpose, String name) {}

    ChatTurnDto parseTurn(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start < 0 || end <= start) return null;
        try {
            RawTurn parsed = objectMapper.readValue(trimmed.substring(start, end + 1), RawTurn.class);
            if (parsed.say() == null || parsed.say().isBlank()) return null;
            List<AgentActionDto> actions = new ArrayList<>();
            if (parsed.actions() != null) {
                for (RawAction a : parsed.actions()) {
                    if (isValidAction(a)) {
                        actions.add(new AgentActionDto(a.op(), a.sku(), a.qty(), a.note(), a.purpose(), a.name()));
                    }
                }
            }
            return new ChatTurnDto(parsed.say().trim(), parsed.buyer_name(), actions);
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isValidAction(RawAction a) {
        if (a == null || a.op() == null) return false;
        String op = a.op();
        return switch (op) {
            case "clear", "quote", "capture", "retry" -> true;
            case "remove" -> a.sku() != null;
            case "mandate" -> a.purpose() != null;
            case "add" -> a.sku() != null && a.qty() != null;
            default -> false;
        };
    }

    // ------------------------------------------------------------- apply

    void applyTurn(ShopSession session, ChatTurnDto turn) {
        if (turn.buyerName() != null && !turn.buyerName().isBlank()) {
            session.setBuyerName(turn.buyerName());
            sessionRepository.save(session);
        }
        if (turn.actions() != null) {
            for (AgentActionDto action : turn.actions()) {
                applyAction(session, action);
            }
        }
    }

    void applyAction(ShopSession session, AgentActionDto action) {
        try {
            switch (action.op()) {
                case "add" -> cartService.addLine(session, action.sku(), action.qty(), action.note());
                case "remove" -> cartService.removeLine(session, action.sku());
                case "clear" -> cartService.clearCart(session);
                case "quote" -> engineService.runQuote(session);
                case "mandate" -> engineService.requestMandate(session, action.purpose());
                case "capture", "retry" -> engineService.capture(session);
                default -> { /* unknown op: ignore, the engine is the source of truth */ }
            }
        } catch (RuntimeException ex) {
            // The engine refused (unknown SKU, blocked quote, etc). Munim's next
            // turn will see the resulting state and can react - we don't let one
            // bad action abort the rest of the turn, matching the original's
            // fire-and-forget applyAction().
        }
    }

    private void pushMessage(ShopSession session, ChatRole role, String text) {
        ChatMessage message = ChatMessage.builder()
            .id(UUID.randomUUID())
            .session(session)
            .role(role)
            .text(text)
            .at(Instant.now(shopClock))
            .build();
        chatMessageRepository.save(message);
    }
}
