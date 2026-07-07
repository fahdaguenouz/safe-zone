package com.buy01.user_service.controller;

import com.buy01.user_service.dto.UpdateProfileRequest;
import com.buy01.user_service.dto.UserProfileResponse;
import com.buy01.user_service.models.User;
import com.buy01.user_service.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    @Value("${media-service.base-url}")
    private String mediaServiceBaseUrl;

    // GET /users/me - Fetch my own profile
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentProfile(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(mapToResponse(currentUser));
    }

    // PUT /users/me - Update my own profile
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {

        // Update the fields
        currentUser.setFirstName(request.firstName());
        currentUser.setLastName(request.lastName());

        if (request.avatarMediaId() != null) {
            currentUser.setAvatarMediaId(request.avatarMediaId());
        }

        // Save back to MongoDB
        User updatedUser = userRepository.save(currentUser);

        return ResponseEntity.ok(mapToResponse(updatedUser));
    }

    // Helper method to convert the User entity to a safe DTO
    private UserProfileResponse mapToResponse(User user) {

        // Construct the full URL if the user has an avatar
        String fullAvatarUrl = null;
        if (user.getAvatarMediaId() != null && !user.getAvatarMediaId().isEmpty()) {
            // Check if it's already a full URL (just in case the frontend sent the whole
            // URL by mistake)
            if (user.getAvatarMediaId().startsWith("http")) {
                fullAvatarUrl = user.getAvatarMediaId();
            } else {
                fullAvatarUrl = mediaServiceBaseUrl + user.getAvatarMediaId();
            }
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                // Pass the full URL to the frontend!
                .avatarMediaId(fullAvatarUrl)
                .build();
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        return ResponseEntity.ok(mapToResponse(user));
    }
}