package com.whatsappclone.controller;

import com.whatsappclone.dto.PrivacySettingsDto;
import com.whatsappclone.model.User;
import com.whatsappclone.model.PrivacySettings;
import com.whatsappclone.repo.UserRepository;
import com.whatsappclone.repo.ContactRepository;
import com.whatsappclone.repo.PrivacySettingsRepository;
import com.whatsappclone.service.PrivacyService;
import com.whatsappclone.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final PrivacySettingsRepository privacySettingsRepository;
    private final PrivacyService privacyService;
    private final PresenceService presenceService;
    private final ContactRepository contactRepository;

    private static final String UPLOAD_DIR = "uploads";

    // 1. Search users by mobile/username
    @GetMapping("/search")
    public ResponseEntity<?> searchByPhoneNumber(@RequestParam(name = "query", required = false) String qParam,
                                                @RequestParam(name = "q", required = false) String qShort,
                                                @RequestParam(name = "mobile", required = false) String mobile,
                                                @RequestParam(name = "phone", required = false) String phone,
                                                @RequestParam(name = "phoneNumber", required = false) String phoneNumber) {
        String query = (qParam != null && !qParam.isBlank()) ? qParam :
                       (qShort != null && !qShort.isBlank()) ? qShort :
                       (mobile != null && !mobile.isBlank()) ? mobile :
                       (phone != null && !phone.isBlank()) ? phone : phoneNumber;
        if (query != null) {
            query = query.trim();
        }
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Phone number query missing"));
        }

        User found = null;
        String normalizedQuery = normalizePhoneDigits(query);
        String loweredQuery = query.toLowerCase(Locale.ROOT);

        // Try phone number first
        var byPhone = userRepository.findByPhoneNumber(query);
        if (byPhone.isPresent()) found = byPhone.get();

        // Then exact username
        if (found == null) {
            var byExact = userRepository.findByUsername(query);
            if (byExact.isPresent()) found = byExact.get();
        }

        // Case-insensitive fallback using list (safe — no NonUniqueResultException)
        if (found == null) {
            var matches = userRepository.findAllByUsernameIgnoreCase(query);
            if (!matches.isEmpty()) found = matches.get(0);
        }

        // Fallback: tolerate formatted phone numbers and partial username/phone searches.
        if (found == null) {
            List<User> users = userRepository.findAll();
            found = users.stream()
                    .filter(user -> matchesSearchQuery(user, loweredQuery, normalizedQuery))
                    .findFirst()
                    .orElse(null);
        }

        if (found != null) {
            User user = found;
            return ResponseEntity.ok(new UserDto(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getPhoneNumber(),
                    user.getProfilePicUrl() != null ? user.getProfilePicUrl()
                            : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
            ));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "No user found matching this query."));
    }

    // 2. Get current authenticated user's profile (for session restore)
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        String currentUsername = principal.getName();
        User user = userRepository.findByUsername(currentUsername).orElse(null);
        if (user == null) {
            var list = userRepository.findAllByUsernameIgnoreCase(currentUsername);
            if (!list.isEmpty()) user = list.get(0);
        }
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getProfilePicUrl() != null ? user.getProfilePicUrl()
                        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
        ));
    }

    // 2c. Delete current authenticated user's account permanently
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        String currentUsername = principal.getName();
        User user = userRepository.findByUsername(currentUsername).orElse(null);
        if (user == null) {
            var list = userRepository.findAllByUsernameIgnoreCase(currentUsername);
            if (!list.isEmpty()) user = list.get(0);
        }
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        try {
            // 1. PrivacySettings delete karo
            privacySettingsRepository.findByUser(user).ifPresent(privacySettingsRepository::delete);

            // 2. Contacts delete karo (jahan yeh user owner hai)
            contactRepository.deleteAllByOwner(user);

            // 3. User delete karo
            userRepository.delete(user);

            log.info("Account deleted for user: {}", currentUsername);
            return ResponseEntity.ok(Map.of("message", "Account successfully deleted"));
        } catch (Exception e) {
            log.error("Error deleting account for user: {}", currentUsername, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Account delete karne mein error aaya: " + e.getMessage()));
        }
    }

    // 2b. Get all users (fallback/directory list)
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDto> dtos = users.stream()
                .map(user -> new UserDto(
                        user.getId(), 
                        user.getUsername(), 
                        user.getEmail(), 
                        user.getPhoneNumber(),
                        user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // 3. Update core profile properties
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, Principal principal) {
        String currentUsername = principal.getName();
        java.util.Optional<User> userOpt = userRepository.findByUsername(currentUsername);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        if (request.username() != null && !request.username().isBlank()) {
            if (!user.getUsername().equals(request.username()) && userRepository.existsByUsername(request.username())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Username already taken"));
            }
            user.setUsername(request.username());
        }
        if (request.email() != null && !request.email().isBlank()) {
            user.setEmail(request.email());
        }
        if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
            user.setPhoneNumber(request.phoneNumber());
        }
        if (request.profilePicUrl() != null) {
            user.setProfilePicUrl(request.profilePicUrl());
        }
        User saved = userRepository.save(user);
        return ResponseEntity.ok(new UserDto(
                saved.getId(), 
                saved.getUsername(), 
                saved.getEmail(), 
                saved.getPhoneNumber(),
                saved.getProfilePicUrl()
        ));
    }

    // 4. Update current user's about section
    @PutMapping("/about")
    public ResponseEntity<?> updateAbout(@RequestBody Map<String, String> request, Principal principal) {
        String currentUsername = principal.getName();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String about = request.get("about");
        if (about == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "about text missing"));
        }
        user.setAbout(about);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("about", user.getAbout()));
    }

    // 5. Get current privacy settings
    @GetMapping("/privacy")
    public ResponseEntity<PrivacySettingsDto> getPrivacySettings(Principal principal) {
        String currentUsername = principal.getName();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        PrivacySettings settings = privacyService.getSettingsForUser(user);
        return ResponseEntity.ok(new PrivacySettingsDto(
                settings.getLastSeenVisibility(),
                settings.getOnlineVisibility(),
                settings.getProfilePhotoVisibility(),
                settings.getAboutVisibility(),
                settings.isReadReceipts(),
                settings.getGroupPrivacy(),
                settings.getCallPrivacy()
        ));
    }

    // 6. Update privacy settings
    @PutMapping("/privacy")
    public ResponseEntity<PrivacySettingsDto> updatePrivacySettings(@RequestBody PrivacySettingsDto dto, Principal principal) {
        String currentUsername = principal.getName();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        PrivacySettings settings = privacyService.getSettingsForUser(user);
        
        settings.setLastSeenVisibility(dto.getLastSeenVisibility());
        settings.setOnlineVisibility(dto.getOnlineVisibility());
        settings.setProfilePhotoVisibility(dto.getProfilePhotoVisibility());
        settings.setAboutVisibility(dto.getAboutVisibility());
        settings.setReadReceipts(dto.isReadReceipts());
        settings.setGroupPrivacy(dto.getGroupPrivacy());
        settings.setCallPrivacy(dto.getCallPrivacy());

        PrivacySettings saved = privacySettingsRepository.save(settings);
        return ResponseEntity.ok(new PrivacySettingsDto(
                saved.getLastSeenVisibility(),
                saved.getOnlineVisibility(),
                saved.getProfilePhotoVisibility(),
                saved.getAboutVisibility(),
                saved.isReadReceipts(),
                saved.getGroupPrivacy(),
                saved.getCallPrivacy()
        ));
    }

    // 7. Get user profile respecting privacy visibility rules
    @GetMapping("/{username}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable String username, Principal principal) {
        String currentUsername = principal.getName();
        // principal.getName() is always exact — use exact lookup
        User viewer = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Viewer user not found"));
        // target username from path — use safe list fallback
        User target = null;
        var targetExact = userRepository.findByUsername(username);
        if (targetExact.isPresent()) {
            target = targetExact.get();
        } else {
            var targetList = userRepository.findAllByUsernameIgnoreCase(username);
            if (!targetList.isEmpty()) target = targetList.get(0);
        }
        if (target == null) throw new IllegalArgumentException("Target user not found");

        boolean canSeeLastSeen = privacyService.canSeeLastSeen(target, viewer);
        boolean canSeeOnline = privacyService.canSeeOnline(target, viewer);
        boolean canSeePhoto = privacyService.canSeeProfilePhoto(target, viewer);
        boolean canSeeAbout = privacyService.canSeeAbout(target, viewer);

        boolean isOnline = presenceService.isUserOnline(target.getUsername());

        String defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
        String avatar = canSeePhoto && target.getProfilePicUrl() != null ? target.getProfilePicUrl() : defaultAvatar;
        String about = canSeeAbout ? target.getAbout() : "About is hidden";
        
        String lastSeenText;
        if (isOnline && canSeeOnline) {
            lastSeenText = "Online";
        } else if (canSeeLastSeen) {
            lastSeenText = formatLastSeen(target.getLastSeen());
        } else {
            lastSeenText = "Last Seen Hidden";
        }

        String displayName = target.getUsername();
        var contactOpt = contactRepository.findByOwnerAndContactUser(viewer, target);
        if (contactOpt.isPresent() && contactOpt.get().getCustomName() != null) {
            displayName = contactOpt.get().getCustomName();
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", target.getId());
        profile.put("name", displayName);
        profile.put("username", target.getUsername());
        profile.put("phoneNumber", target.getPhoneNumber());
        profile.put("about", about);
        profile.put("avatar", avatar);
        profile.put("lastSeen", lastSeenText);
        profile.put("isOnline", isOnline && canSeeOnline);

        return ResponseEntity.ok(profile);
    }

    // 8. Upload Profile Picture
    @PostMapping("/profile-image")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file, Principal principal) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }
        
        // Size validation: max 5MB
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 5MB limit"));
        }

        // Type validation
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/jpg") && !contentType.equals("image/png"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only JPG, JPEG, and PNG images are supported"));
        }

        try {
            // Create uploads directory if not exist
            File uploadFolder = new File(UPLOAD_DIR);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            // Sanitize and generate unique filename
            String cleanName = file.getOriginalFilename().replaceAll("[^a-zA-Z0-9\\.\\-_]", "_");
            String filename = System.currentTimeMillis() + "_" + cleanName;
            Path targetPath = Paths.get(UPLOAD_DIR).resolve(filename);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Update user profile URL in DB
            String currentUsername = principal.getName();
            User user = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/users/profile-image/")
                    .path(filename)
                    .toUriString();
            user.setProfilePicUrl(fileUrl);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("profilePicUrl", fileUrl));
        } catch (Exception e) {
            log.error("Image upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store file: " + e.getMessage()));
        }
    }

    // 9. Serve Profile Image
    @GetMapping("/profile-image/{filename:.+}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) {
        try {
            Path file = Paths.get(UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) contentType = "image/jpeg";
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private String formatLastSeen(LocalDateTime lastSeen) {
        if (lastSeen == null) return "Last seen long ago";
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate lastSeenDate = lastSeen.toLocalDate();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        String timeStr = lastSeen.format(timeFormatter);

        if (lastSeenDate.equals(today)) {
            return "Last Seen Today at " + timeStr;
        } else if (lastSeenDate.equals(today.minusDays(1))) {
            return "Last Seen Yesterday at " + timeStr;
        } else {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            return "Last Seen on " + lastSeen.format(dateFormatter) + " at " + timeStr;
        }
    }

    public static record UpdateProfileRequest(String username, String email, String phoneNumber, String profilePicUrl) {}

    public static record UserDto(Long id, String username, String email, String phoneNumber, String profilePicUrl) {}

    private boolean matchesSearchQuery(User user, String loweredQuery, String normalizedQuery) {
        String username = user.getUsername() != null ? user.getUsername().trim().toLowerCase(Locale.ROOT) : "";
        String phone = normalizePhoneDigits(user.getPhoneNumber());

        boolean usernameMatch = !loweredQuery.isBlank() && username.contains(loweredQuery);
        boolean phoneExactMatch = !normalizedQuery.isBlank() && phone.equals(normalizedQuery);
        
        boolean phoneMatch = false;
        if (!normalizedQuery.isBlank() && !phone.isBlank()) {
            if (phone.equals(normalizedQuery)) {
                phoneMatch = true;
            } else if (normalizedQuery.length() >= 10 && phone.length() >= 10) {
                String qLast10 = normalizedQuery.substring(normalizedQuery.length() - 10);
                String pLast10 = phone.substring(phone.length() - 10);
                phoneMatch = qLast10.equals(pLast10);
            } else {
                phoneMatch = phone.endsWith(normalizedQuery) || normalizedQuery.endsWith(phone);
            }
        }

        return usernameMatch || phoneExactMatch || phoneMatch;
    }

    private String normalizePhoneDigits(String value) {
        if (value == null) return "";
        return value.replaceAll("\\D", "");
    }
}
