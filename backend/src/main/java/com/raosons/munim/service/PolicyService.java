package com.raosons.munim.service;

import com.raosons.munim.domain.Policy;
import com.raosons.munim.domain.enums.AuditKind;
import com.raosons.munim.domain.enums.Category;
import com.raosons.munim.dto.PolicyDto;
import com.raosons.munim.dto.PolicyUpdateRequest;
import com.raosons.munim.repository.PolicyRepository;
import com.raosons.munim.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * The wall rules at the gaddi: shop cap, auto-approve line, daily cap, and
 * the "trip the next payment" demo lever. Mirrors policy.ts's Policy plus
 * the setPolicy/restock actions in store.ts.
 */
@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final ProductRepository productRepository;
    private final AuditService auditService;

    public PolicyService(PolicyRepository policyRepository, ProductRepository productRepository, AuditService auditService) {
        this.policyRepository = policyRepository;
        this.productRepository = productRepository;
        this.auditService = auditService;
    }

    public Policy getPolicyEntity() {
        return policyRepository.findById(1L)
            .orElseThrow(() -> new IllegalStateException("Policy row is not seeded."));
    }

    public PolicyDto getPolicy() {
        return EntityMappers.toDto(getPolicyEntity());
    }

    @Transactional
    public PolicyDto updatePolicy(PolicyUpdateRequest patch) {
        Policy policy = getPolicyEntity();
        List<String> changedKeys = new ArrayList<>();
        if (patch.maxOrderPaise() != null) { policy.setMaxOrderPaise(patch.maxOrderPaise()); changedKeys.add("maxOrderPaise"); }
        if (patch.autoApproveBelowPaise() != null) { policy.setAutoApproveBelowPaise(patch.autoApproveBelowPaise()); changedKeys.add("autoApproveBelowPaise"); }
        if (patch.dailyCapPaise() != null) { policy.setDailyCapPaise(patch.dailyCapPaise()); changedKeys.add("dailyCapPaise"); }
        if (patch.allowCredit() != null) { policy.setAllowCredit(patch.allowCredit()); changedKeys.add("allowCredit"); }
        if (patch.maxPaymentRetries() != null) { policy.setMaxPaymentRetries(patch.maxPaymentRetries()); changedKeys.add("maxPaymentRetries"); }
        if (patch.holdMinutes() != null) { policy.setHoldMinutes(patch.holdMinutes()); changedKeys.add("holdMinutes"); }
        if (patch.requireNamedBuyer() != null) { policy.setRequireNamedBuyer(patch.requireNamedBuyer()); changedKeys.add("requireNamedBuyer"); }
        if (patch.tripNextPayment() != null) { policy.setTripNextPayment(patch.tripNextPayment()); changedKeys.add("tripNextPayment"); }
        if (patch.blockedCategories() != null) {
            List<Category> categories = patch.blockedCategories().stream()
                .map(String::toUpperCase)
                .map(Category::valueOf)
                .toList();
            policy.setBlockedCategories(categories);
            changedKeys.add("blockedCategories");
        }
        Policy saved = policyRepository.save(policy);
        auditService.record(AuditKind.POLICY, "Wall rules updated from the gaddi", null, null,
            java.util.Map.of("keys", String.join(",", changedKeys)));
        return EntityMappers.toDto(saved);
    }

    /** Resets every SKU's stock to its original seed level - "Restock the shelf from the book." */
    @Transactional
    public void restock() {
        productRepository.findAll().forEach(p -> p.setStock(p.getSeedStock()));
    }
}
