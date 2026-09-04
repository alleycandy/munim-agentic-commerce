package com.raosons.munim.dto;

/**
 * The response envelope for /chat, mirroring the discriminated union the
 * front-end's askMunim() server function returned: {ok:true, turn} or
 * {ok:false, error}.
 */
public record ChatTurnResponse(
    boolean ok,
    ChatTurnDto turn,
    String error,
    SessionStateDto state
) {
    public static ChatTurnResponse failure(String error) {
        return new ChatTurnResponse(false, null, error, null);
    }

    public static ChatTurnResponse success(ChatTurnDto turn, SessionStateDto state) {
        return new ChatTurnResponse(true, turn, null, state);
    }
}
