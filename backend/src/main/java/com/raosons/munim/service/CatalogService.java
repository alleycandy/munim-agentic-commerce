package com.raosons.munim.service;

import com.raosons.munim.domain.Merchant;
import com.raosons.munim.domain.Product;
import com.raosons.munim.dto.CatalogForAgentsResponse;
import com.raosons.munim.dto.MerchantDto;
import com.raosons.munim.dto.ProductAgentDto;
import com.raosons.munim.dto.ProductDto;
import com.raosons.munim.exception.NotFoundException;
import com.raosons.munim.repository.MerchantRepository;
import com.raosons.munim.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/** Mirrors catalog.ts: the shelf, what's on it, and what a machine is allowed to know about it. */
@Service
public class CatalogService {

    private final ProductRepository productRepository;
    private final MerchantRepository merchantRepository;

    public CatalogService(ProductRepository productRepository, MerchantRepository merchantRepository) {
        this.productRepository = productRepository;
        this.merchantRepository = merchantRepository;
    }

    public List<ProductDto> listProducts() {
        return productRepository.findAll().stream().map(EntityMappers::toDto).toList();
    }

    public ProductDto getProduct(String sku) {
        return EntityMappers.toDto(requireProduct(sku));
    }

    Product requireProduct(String sku) {
        return productRepository.findById(sku)
            .orElseThrow(() -> new NotFoundException("Unknown SKU " + sku + "."));
    }

    public List<ProductDto> search(String query) {
        String q = query == null ? "" : query.trim().toLowerCase();
        if (q.isEmpty()) {
            return listProducts();
        }
        return productRepository.findAll().stream()
            .filter(p -> haystack(p).contains(q))
            .map(EntityMappers::toDto)
            .toList();
    }

    private String haystack(Product p) {
        StringBuilder sb = new StringBuilder();
        sb.append(p.getName()).append(' ').append(p.getSku()).append(' ').append(p.getOrigin())
          .append(' ').append(p.getNotesForAgents()).append(' ').append(p.getCategory().name().toLowerCase());
        p.getAliases().forEach(a -> sb.append(' ').append(a));
        return sb.toString().toLowerCase();
    }

    public MerchantDto getMerchant() {
        Merchant m = merchantRepository.findById(1L)
            .orElseThrow(() -> new IllegalStateException("Merchant row is not seeded."));
        return EntityMappers.toDto(m);
    }

    /** The bare agent-shaped product list, matching catalogForAgents() in catalog.ts (used to build the chat system prompt). */
    public List<ProductAgentDto> catalogForAgentsList() {
        return productRepository.findAll().stream().map(EntityMappers::toAgentDto).toList();
    }

    public CatalogForAgentsResponse catalogForAgents() {
        Merchant m = merchantRepository.findById(1L)
            .orElseThrow(() -> new IllegalStateException("Merchant row is not seeded."));
        List<ProductAgentDto> products = productRepository.findAll().stream()
            .map(EntityMappers::toAgentDto)
            .toList();
        var agentMerchant = new CatalogForAgentsResponse.AgentMerchant(
            m.getName(), m.getGstin(), m.getAddress(), m.getHours(), m.getRazorpayAccount(),
            "INR", "munim.aisle/v0"
        );
        return new CatalogForAgentsResponse(agentMerchant, products);
    }
}
