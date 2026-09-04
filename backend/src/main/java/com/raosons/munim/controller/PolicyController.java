package com.raosons.munim.controller;

import com.raosons.munim.dto.PolicyDto;
import com.raosons.munim.dto.PolicyUpdateRequest;
import com.raosons.munim.service.PolicyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/policy")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @GetMapping
    public PolicyDto getPolicy() {
        return policyService.getPolicy();
    }

    /** Partial update of the wall rules - every field optional. */
    @PatchMapping
    public PolicyDto updatePolicy(@Valid @RequestBody PolicyUpdateRequest patch) {
        return policyService.updatePolicy(patch);
    }

    /** Resets every SKU's stock to its seed level. */
    @PostMapping("/restock")
    public ResponseEntity<Void> restock() {
        policyService.restock();
        return ResponseEntity.noContent().build();
    }
}
