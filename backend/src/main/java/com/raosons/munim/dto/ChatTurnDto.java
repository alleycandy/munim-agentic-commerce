package com.raosons.munim.dto;

import java.util.List;

public record ChatTurnDto(
    String say,
    String buyerName,
    List<AgentActionDto> actions
) {}
