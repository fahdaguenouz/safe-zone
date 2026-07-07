package com.buy01.product_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import com.buy01.product_service.models.ProductMedia;

public record ProductRequest(
    @NotBlank(message = "Product name is required") String name,
    @NotBlank(message = "Description is required") String description,
    @NotNull(message = "Price is required") @Min(value = 0, message = "Price cannot be negative") BigDecimal price,
    @NotNull(message = "Stock quantity is required") @Min(value = 0, message = "Stock cannot be negative") Integer stockQuantity,
    @NotBlank(message = "Category is required") String category,
   List<ProductMedia> media
) {}