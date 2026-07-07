package com.buy01.product_service.models;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.buy01.product_service.models.ProductMedia;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "products")
public class Product {

    @Id
    @Builder.Default
    private String id = java.util.UUID.randomUUID().toString();

    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String category;

    // Security & Ownership: The UUID of the user who created this product
    private String sellerId;

    private List<ProductMedia> media;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}