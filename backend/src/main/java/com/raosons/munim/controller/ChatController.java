package com.raosons.munim.controller;

import com.raosons.munim.domain.ShopSession;
import com.raosons.munim.dto.ChatMessageDto;
import com.raosons.munim.dto.ChatTurnResponse;
import com.raosons.munim.dto.EngineResultDto;
import com.raosons.munim.dto.SendChatRequest;
import com.raosons.munim.service.ChatService;
import com.raosons.munim.service.DemoScriptService;
import com.raosons.munim.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions/{id}")
public class ChatController {

    private final ChatService chatService;
    private final DemoScriptService demoScriptService;
    private final SessionService sessionService;

    public ChatController(ChatService chatService, DemoScriptService demoScriptService, SessionService sessionService) {
        this.chatService = chatService;
        this.demoScriptService = demoScriptService;
        this.sessionService = sessionService;
    }

    /**
     * Talk to Munim. Requires XAI_API_KEY to be set on the server; if it
     * isn't, this returns {"ok":false,"error":...} rather than a 5xx, so a
     * client can fall back to the demo script gracefully.
     */
    @PostMapping("/chat")
    public ChatTurnResponse chat(@PathVariable UUID id, @Valid @RequestBody SendChatRequest request) {
        ShopSession session = sessionService.requireSession(id);
        return chatService.chat(session, request.text());
    }

    @GetMapping("/messages")
    public List<ChatMessageDto> messages(@PathVariable UUID id) {
        sessionService.requireSession(id);
        return chatService.history(id);
    }

    /** Plays the recorded "Hotel Surya breakfast" script against the real engine - no model required. */
    @PostMapping("/demo/hotel-breakfast")
    public EngineResultDto playHotelBreakfast(@PathVariable UUID id) {
        ShopSession session = sessionService.requireSession(id);
        return demoScriptService.play(session);
    }
}
