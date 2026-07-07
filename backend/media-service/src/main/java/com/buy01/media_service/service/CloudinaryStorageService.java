package com.buy01.media_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryStorageService {

    private final Cloudinary cloudinary;

    public Map storeFile(MultipartFile file) {

        // 1. Validate content type
        String contentType = file.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        // 2. Deep validation
        try (InputStream input = file.getInputStream()) {

            if (ImageIO.read(input) == null) {
                throw new IllegalArgumentException("Invalid image file.");
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to validate image.", e);
        }

        try {

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

            String extension = "";

            if (originalFilename.contains(".")) {
                extension = originalFilename.substring(
                        originalFilename.lastIndexOf("."));
            }

            String publicId = UUID.randomUUID().toString();

            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", publicId,
                            "folder", "buy01",
                            "resource_type", "image"));

            return uploadResult;

        } catch (Exception e) {

            log.error("Cloudinary upload failed", e);

            throw new RuntimeException(e);
            
        }
    }

    public boolean deleteFile(String publicId) {

        try {

            Map result = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.emptyMap());

            String status = (String) result.get("result");

            return "ok".equals(status);

        } catch (Exception e) {

            log.error("Failed to delete image {}", publicId, e);

            return false;
        }
    }
}