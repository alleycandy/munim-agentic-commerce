package com.raosons.munim.controller;

import com.raosons.munim.dto.CatalogForAgentsResponse;
import com.raosons.munim.dto.MerchantDto;
import com.raosons.munim.dto.ProductDto;
import com.raosons.munim.service.CatalogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/catalog/products")
    public List<ProductDto> listProducts(@RequestParam(name = "q", required = false) String query) {
        return (query == null || query.isBlank()) ? catalogService.listProducts() : catalogService.search(query);
    }

    @GetMapping("/catalog/products/{sku}")
    public ProductDto getProduct(@PathVariable String sku) {
        return catalogService.getProduct(sku);
    }

    /** Machine-readable catalog for a purchasing agent, mirroring catalogForAgents() in catalog.ts. */
    @GetMapping("/catalog/agents")
    public CatalogForAgentsResponse catalogForAgents() {
        return catalogService.catalogForAgents();
    }

    @GetMapping("/merchant")
    public MerchantDto merchant() {
        return catalogService.getMerchant();
    }
}
