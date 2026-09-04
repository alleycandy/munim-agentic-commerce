package com.raosons.munim.service;

import com.raosons.munim.domain.CartLine;
import com.raosons.munim.domain.Product;
import com.raosons.munim.domain.ShopSession;
import com.raosons.munim.exception.EngineException;
import com.raosons.munim.repository.CartLineRepository;
import com.raosons.munim.repository.ProductRepository;
import com.raosons.munim.repository.ShopSessionRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

/**
 * Mutating the chit. Every change invalidates whatever quote / mandate /
 * payment was in flight for this session - exactly like store.ts setting
 * quote / mandate / payment back to null on any cart edit.
 */
@Service
public class CartService {

    private final CartLineRepository cartLineRepository;
    private final ProductRepository productRepository;
    private final ShopSessionRepository sessionRepository;

    public CartService(CartLineRepository cartLineRepository, ProductRepository productRepository, ShopSessionRepository sessionRepository) {
        this.cartLineRepository = cartLineRepository;
        this.productRepository = productRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public String addLine(ShopSession session, String sku, int qty, String note) {
        Product product = productRepository.findById(sku)
            .orElseThrow(() -> new EngineException("Unknown SKU " + sku + "."));
        if (qty <= 0) {
            throw new EngineException(product.getName() + ": quantity must be at least 1.");
        }

        CartLine line = cartLineRepository.findBySessionAndSku(session, sku).orElse(null);
        int nextQty = (line == null ? 0 : line.getQty()) + qty;
        if (line == null) {
            line = CartLine.builder()
                .session(session)
                .sku(sku)
                .qty(nextQty)
                .note(note)
                .unitPaiseAtAdd(product.getPricePaise())
                .gstPctAtAdd(product.getGstPct())
                .build();
        } else {
            line.setQty(nextQty);
            line.setNote(note);
            line.setUnitPaiseAtAdd(product.getPricePaise());
            line.setGstPctAtAdd(product.getGstPct());
        }
        cartLineRepository.save(line);
        invalidateEngineState(session);
        return "Added " + qty + " x " + product.getName() + ".";
    }

    @Transactional
    public void removeLine(ShopSession session, String sku) {
        cartLineRepository.deleteBySessionAndSku(session, sku);
        invalidateEngineState(session);
    }

    @Transactional
    public void clearCart(ShopSession session) {
        cartLineRepository.deleteBySession(session);
        invalidateEngineState(session);
    }

    private void invalidateEngineState(ShopSession session) {
        session.clearEngineState();
        sessionRepository.save(session);
    }
}
