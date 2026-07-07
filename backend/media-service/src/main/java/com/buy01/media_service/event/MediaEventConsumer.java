package com.buy01.media_service.event;

import com.buy01.media_service.service.CloudinaryStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaEventConsumer {

    private final CloudinaryStorageService cloudinaryStorageService;

    @KafkaListener(topics = "product-deletion-topic", groupId = "media-group")
    public void consumeProductDeletedEvent(String publicId) {

        log.info("Received delete event for image: {}", publicId);

        try {

            boolean deleted = cloudinaryStorageService.deleteFile(publicId);

            if (deleted) {
                log.info("Deleted image {} from Cloudinary", publicId);
            } else {
                log.warn("Cloudinary could not delete {}", publicId);
            }

        } catch (Exception e) {

            log.error("Cloudinary deletion failed", e);

        }

    }

}