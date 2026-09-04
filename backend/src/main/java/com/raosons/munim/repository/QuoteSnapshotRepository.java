package com.raosons.munim.repository;

import com.raosons.munim.domain.QuoteSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuoteSnapshotRepository extends JpaRepository<QuoteSnapshot, UUID> {
}
