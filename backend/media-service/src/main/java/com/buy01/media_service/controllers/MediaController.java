package com.buy01.media_service.controllers;

import com.buy01.media_service.CloudinaryStorageService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final CloudinaryStorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<List<Map<String, String>>> uploadFiles(
            @RequestParam("file") List<MultipartFile> files) {

        List<Map<String, String>> responses = new ArrayList<>();

        for (MultipartFile file : files) {

            Map uploadResult = storageService.storeFile(file);

            Map<String, String> response = Map.of(
                    "imageUrl", uploadResult.get("secure_url").toString(),
                    "publicId", uploadResult.get("public_id").toString()
            );

            responses.add(response);
        }

        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{publicId}")
    public ResponseEntity<String> deleteImage(
            @PathVariable String publicId) {

        boolean deleted = storageService.deleteFile(publicId);

        if (deleted) {
            return ResponseEntity.ok("Image deleted successfully.");
        }

        return ResponseEntity.badRequest()
                .body("Failed to delete image.");
    }
}