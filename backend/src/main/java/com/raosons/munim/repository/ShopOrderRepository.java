package com.raosons.munim.repository;

import com.raosons.munim.domain.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, UUID> {
    List<ShopOrder> findAllByOrderByCreatedAtDesc();

    List<ShopOrder> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);

    @Query("select coalesce(sum(o.totalPaise), 0) from ShopOrder o " +
           "where o.status = com.raosons.munim.domain.enums.OrderStatus.PAID and o.createdAt >= :start")
    long sumPaidSince(Instant start);
}
