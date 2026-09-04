package com.raosons.munim.repository;

import com.raosons.munim.domain.Mandate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MandateRepository extends JpaRepository<Mandate, UUID> {
    List<Mandate> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
}
