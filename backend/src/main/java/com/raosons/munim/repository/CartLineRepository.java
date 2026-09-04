package com.raosons.munim.repository;

import com.raosons.munim.domain.CartLine;
import com.raosons.munim.domain.ShopSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartLineRepository extends JpaRepository<CartLine, Long> {
    List<CartLine> findBySessionIdOrderByIdAsc(UUID sessionId);

    Optional<CartLine> findBySessionAndSku(ShopSession session, String sku);

    void deleteBySessionAndSku(ShopSession session, String sku);

    void deleteBySession(ShopSession session);
}
