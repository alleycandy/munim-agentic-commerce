package com.raosons.munim.service;

import com.raosons.munim.domain.ChatMessage;
import com.raosons.munim.domain.ShopSession;
import com.raosons.munim.domain.enums.ChatRole;
import com.raosons.munim.dto.EngineResultDto;
import com.raosons.munim.repository.ChatMessageRepository;
import com.raosons.munim.repository.ShopSessionRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A recorded morning at the counter - not a fake model, the same money
 * engine the live agent uses, played in order. Hotel Surya's purchasing
 * agent wants breakfast dry goods under Rs 2,000. Thick poha is short.
 * Munim discloses, substitutes, re-quotes, takes a bounded payment.
 *
 * A faithful port of demo-script.ts's HOTEL_BREAKFAST, useful for
 * demonstrating the full engine without an XAI_API_KEY.
 */
@Service
public class DemoScriptService {

    private final CartService cartService;
    private final EngineService engineService;
    private final SessionService sessionService;
    private final ChatMessageRepository chatMessageRepository;
    private final ShopSessionRepository sessionRepository;
    private final Clock shopClock;

    public DemoScriptService(
        CartService cartService,
        EngineService engineService,
        SessionService sessionService,
        ChatMessageRepository chatMessageRepository,
        ShopSessionRepository sessionRepository,
        Clock shopClock
    ) {
        this.cartService = cartService;
        this.engineService = engineService;
        this.sessionService = sessionService;
        this.chatMessageRepository = chatMessageRepository;
        this.sessionRepository = sessionRepository;
        this.shopClock = shopClock;
    }

    private record Beat(String who, String text, String op, String sku, Integer qty, String note, String purpose, String buyerName) {
        static Beat say(String who, String text) { return new Beat(who, text, null, null, null, null, null, null); }
        Beat withBuyerName(String name) { return new Beat(who, text, "buyerName", null, null, null, null, name); }
        Beat withAdd(String sku, int qty, String note) { return new Beat(who, text, "add", sku, qty, note, null, null); }
        Beat withQuote() { return new Beat(who, text, "quote", null, null, null, null, null); }
        Beat withMandate(String purpose) { return new Beat(who, text, "mandate", null, null, null, purpose, null); }
        Beat withCapture() { return new Beat(who, text, "capture", null, null, null, null, null); }
    }

    private static final List<Beat> HOTEL_BREAKFAST = List.of(
        Beat.say("system", "A purchasing agent for Hotel Surya, Koregaon Park, is at the counter."),
        Beat.say("buyer",
            "Hotel Surya. Breakfast for forty rooms. 8 kg thick poha, 2 litres cold-pressed coconut oil, a kilo of the cutting chai. "
                + "Stay under two thousand. Prefer the same shop as last Thursday.")
            .withBuyerName("Hotel Surya purchasing agent"),
        Beat.say("munim",
            "Surya, theek hai. Thick poha is Rs 95 a kilo. I have six on the shelf, not eight. Coconut oil is Rs 420 a litre - two litres "
                + "is Rs 840. Cutting chai is Rs 180 per 250g, four packs for a kilo is Rs 720. That is already Rs 2,320 before tax, over "
                + "your two thousand, and I am two kilos short on poha."),
        Beat.say("munim",
            "I will not silently fill the last two kilos with thin poha. Thin is for chivda. If you accept six thick and two thin, I will "
                + "write it on the chit. For the bill: groundnut oil is Rs 280 a litre and the kitchen will not notice in poha. "
                + "Drop the tea to 500g. Then we are inside two thousand."),
        Beat.say("buyer", "Six thick, two thin, write it down. Groundnut oil, two litres. Tea, 500g. Go."),
        Beat.say("munim", "On the chit: 6 x thick poha, 2 x thin poha (disclosed), 2 x groundnut oil, 2 x cutting chai.")
            .withAdd("POH-THK-1", 6, "as requested"),
        Beat.say("system", "Substitution disclosed on the chit.")
            .withAdd("POH-THN-1", 2, "disclosed substitute for short thick poha"),
        Beat.say("system", "Groundnut oil added.").withAdd("OIL-GNT-1", 2, null),
        Beat.say("system", "Tea, 500g.").withAdd("TEA-CUT-250", 2, null),
        Beat.say("munim", "Quoting from the book. Not from memory.").withQuote(),
        Beat.say("munim",
            "I am requesting a mandate for the book total - under two thousand - purpose: breakfast dry goods, Hotel Surya. Bound, "
                + "20 minutes, no credit. Under the auto-approve line, so the gaddi will not be woken.")
            .withMandate("Breakfast dry goods for Hotel Surya, Koregaon Park"),
        Beat.say("munim", "Capturing once.").withCapture()
    );

    @Transactional
    public EngineResultDto play(ShopSession session) {
        // resetConversation(): clear messages, cart, current engine pointers, buyer name.
        chatMessageRepository.deleteAll(chatMessageRepository.findBySessionIdOrderByAtAsc(session.getId()));
        cartService.clearCart(session);
        session.setBuyerName("");
        sessionRepository.save(session);

        List<String> notes = new ArrayList<>();
        for (Beat beat : HOTEL_BREAKFAST) {
            pushMessage(session, roleFor(beat.who()), beat.text());
            if (beat.op() != null) {
                applyBeatAction(session, beat, notes);
            }
        }
        notes.add("Played the Hotel Surya breakfast script (" + HOTEL_BREAKFAST.size() + " beats).");
        return new EngineResultDto(notes, sessionService.toStateDto(session));
    }

    private void applyBeatAction(ShopSession session, Beat beat, List<String> notes) {
        switch (beat.op()) {
            case "buyerName" -> {
                session.setBuyerName(beat.buyerName());
                sessionRepository.save(session);
            }
            case "add" -> notes.add(cartService.addLine(session, beat.sku(), beat.qty(), beat.note()));
            case "quote" -> engineService.runQuote(session);
            case "mandate" -> engineService.requestMandate(session, beat.purpose());
            case "capture" -> engineService.capture(session);
            default -> { }
        }
    }

    private ChatRole roleFor(String who) {
        return switch (who) {
            case "buyer" -> ChatRole.BUYER;
            case "munim" -> ChatRole.MUNIM;
            default -> ChatRole.SYSTEM;
        };
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
