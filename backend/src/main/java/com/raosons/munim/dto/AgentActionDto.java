package com.raosons.munim.dto;

/**
 * One action the model asked the engine to take, mirroring AgentAction in
 * ai.ts: {"op":"add","sku":...,"qty":...}, {"op":"mandate","purpose":...}, etc.
 */
public record AgentActionDto(
    String op,
    String sku,
    Integer qty,
    String note,
    String purpose,
    String name
) {}
