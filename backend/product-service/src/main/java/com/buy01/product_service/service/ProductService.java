package com.buy01.product_service.service;

import com.buy01.product_service.dto.ProductRequest;
import com.buy01.product_service.dto.ProductResponse;
import com.buy01.product_service.event.ProductEventProducer;
import com.buy01.product_service.models.Product;
import com.buy01.product_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductEventProducer productEventProducer;

    @Value("${media-service.base-url}")
    private String mediaServiceBaseUrl;

    public ProductResponse createProduct(ProductRequest request, String sellerId) {

        // 1. Sanitize the incoming media IDs so we ONLY store the filename
        List<String> cleanMediaIds = new ArrayList<>(); // ADD THIS LINE
        if (request.mediaIds() != null) {
            for (String mediaUrl : request.mediaIds()) {
                String filename = extractFilename(mediaUrl);
                if (filename != null && !filename.trim().isEmpty()) {
                    cleanMediaIds.add(filename);
                }
            }
        }

        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .stockQuantity(request.stockQuantity())
                .category(request.category())
                .sellerId(sellerId)
                .mediaIds(cleanMediaIds)
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ProductResponse getProductById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + id));
        return mapToResponse(product);
    }

    public List<ProductResponse> getProductsBySeller(String sellerId) {
        return productRepository.findBySellerId(sellerId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void deleteProduct(String productId, String sellerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + productId));

        if (!product.getSellerId().equals(sellerId)) {
            log.warn("Security Alert: User {} attempted to delete Product {} belonging to {}",
                    sellerId, productId, product.getSellerId());
            throw new SecurityException("You do not have permission to delete this product.");
        }

        List<String> mediaIdsToDelete = product.getMediaIds();

        productRepository.delete(product);
        log.info("Product {} successfully deleted from database.", productId);

        if (mediaIdsToDelete != null && !mediaIdsToDelete.isEmpty()) {
            for (String mediaId : mediaIdsToDelete) {
                // Ensure we only send the filename to Kafka
                productEventProducer.publishProductDeletedEvent(extractFilename(mediaId));
            }
        }
    }

    public void updateProduct(String productId, ProductRequest request, String sellerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (!product.getSellerId().equals(sellerId))
            throw new SecurityException("Unauthorized");

        // Update basic fields
        product.setName(request.name());
        product.setPrice(request.price());
        product.setDescription(request.description());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(request.category());

        List<String> cleanMediaIds = new ArrayList<>();
        if (request.mediaIds() != null) {
            for (String mediaUrl : request.mediaIds()) {
                String filename = extractFilename(mediaUrl);
                if (filename != null && !filename.trim().isEmpty()) {
                    cleanMediaIds.add(filename);
                }
            }
        }

        product.setMediaIds(cleanMediaIds.isEmpty() ? null : cleanMediaIds);
        productRepository.save(product);
    }

    private ProductResponse mapToResponse(Product product) {
        List<String> mediaUrls = new ArrayList<>();
        if (product.getMediaIds() != null) {
            for (String mediaId : product.getMediaIds()) {
                if (mediaId != null) { // Null-safe
                    if (mediaId.startsWith("http")) {
                        mediaUrls.add(mediaId);
                    } else {
                        mediaUrls.add(mediaServiceBaseUrl + mediaId);
                    }
                }
            }
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .category(product.getCategory())
                .sellerId(product.getSellerId())
                .mediaIds(mediaUrls)
                .createdAt(product.getCreatedAt())
                .build();
    }

    // Helper method to extract "abc.jpg" from
    // "http://localhost:8083/api/media/images/abc.jpg"
    private String extractFilename(String urlOrId) {
        if (urlOrId == null || urlOrId.trim().isEmpty()) {
            return urlOrId;
        }
        // If it contains a slash, grab everything after the final slash
        if (urlOrId.contains("/")) {
            return urlOrId.substring(urlOrId.lastIndexOf("/") + 1);
        }
        return urlOrId;
    }
}