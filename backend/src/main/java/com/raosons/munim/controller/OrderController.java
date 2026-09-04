package com.raosons.munim.controller;

import com.raosons.munim.dto.OrderDto;
import com.raosons.munim.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderDto> listOrders(@RequestParam(name = "sessionId", required = false) UUID sessionId) {
        return sessionId == null ? orderService.listAll() : orderService.listForSession(sessionId);
    }

    @GetMapping("/{id}")
    public OrderDto getOrder(@PathVariable UUID id) {
        return orderService.get(id);
    }
}
