package com.raosons.munim.service;

import com.raosons.munim.domain.ShopOrder;
import com.raosons.munim.dto.OrderDto;
import com.raosons.munim.exception.NotFoundException;
import com.raosons.munim.repository.ShopOrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/** Filed chits: every order the shop has captured payment for. Mirrors the orders slice of store.ts. */
@Service
public class OrderService {

    private final ShopOrderRepository shopOrderRepository;

    public OrderService(ShopOrderRepository shopOrderRepository) {
        this.shopOrderRepository = shopOrderRepository;
    }

    @Transactional
    public List<OrderDto> listAll() {
        return shopOrderRepository.findAllByOrderByCreatedAtDesc().stream().map(EntityMappers::toDto).toList();
    }

    @Transactional
    public List<OrderDto> listForSession(UUID sessionId) {
        return shopOrderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId).stream().map(EntityMappers::toDto).toList();
    }

    @Transactional
    public OrderDto get(UUID id) {
        ShopOrder order = shopOrderRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("No such order " + id + "."));
        return EntityMappers.toDto(order);
    }
}
