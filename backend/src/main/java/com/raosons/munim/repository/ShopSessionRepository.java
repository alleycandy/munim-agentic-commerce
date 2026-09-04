package com.raosons.munim.repository;

import com.raosons.munim.domain.ShopSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ShopSessionRepository extends JpaRepository<ShopSession, UUID> {
}
