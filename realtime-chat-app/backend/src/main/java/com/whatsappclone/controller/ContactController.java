package com.whatsappclone.controller;

import com.whatsappclone.dto.ContactDTO;
import com.whatsappclone.model.Contact;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.ContactRepository;
import com.whatsappclone.repo.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public ContactController(ContactRepository contactRepository, UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    // Get all contacts of the authenticated user
    @GetMapping
    public ResponseEntity<?> getContacts(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        User owner = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (owner == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        List<ContactDTO> contacts = contactRepository.findByOwner(owner)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }

    // Add a contact by phone number
    @PostMapping
    public ResponseEntity<?> addContact(Principal principal, @RequestBody AddContactRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        User owner = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (owner == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number is required"));
        }

        User contactUser = userRepository.findByPhoneNumber(request.getPhoneNumber()).orElse(null);
        // fallback to username search if no exact phone match
        if (contactUser == null) {
            contactUser = userRepository.findByUsernameIgnoreCase(request.getPhoneNumber()).orElse(null);
        }
        // fallback to digit-normalized phone match
        if (contactUser == null && request.getPhoneNumber() != null) {
            String digits = request.getPhoneNumber().replaceAll("\\D", "");
            if (!digits.isBlank()) {
                List<User> allUsers = userRepository.findAll();
                contactUser = allUsers.stream()
                        .filter(u -> {
                            if (u.getPhoneNumber() == null) return false;
                            String uDigits = u.getPhoneNumber().replaceAll("\\D", "");
                            if (uDigits.isBlank()) return false;
                            if (uDigits.equals(digits)) return true;
                            if (digits.length() >= 10 && uDigits.length() >= 10) {
                                return uDigits.substring(uDigits.length() - 10).equals(digits.substring(digits.length() - 10));
                            }
                            return uDigits.endsWith(digits) || digits.endsWith(uDigits);
                        })
                        .findFirst()
                        .orElse(null);
            }
        }

        if (contactUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "No user found."));
        }

        // Prevent adding self
        if (owner.getId().equals(contactUser.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot add yourself as a contact"));
        }

        // Prevent duplicate
        if (contactRepository.findByOwnerAndContactUser(owner, contactUser).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Contact already exists"));
        }

        Contact contact = new Contact();
        contact.setOwner(owner);
        contact.setContactUser(contactUser);
        contact.setCustomName(contactUser.getUsername()); // default to their username
        Contact saved = contactRepository.save(contact);
        return ResponseEntity.ok(toDTO(saved));
    }

    // Update custom name for a contact
    @PutMapping("/{id}")
    public ResponseEntity<?> updateContact(Principal principal,
                                                    @PathVariable Long id,
                                                    @RequestBody UpdateContactRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        User owner = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (owner == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        Contact contact = contactRepository.findByIdAndOwner(id, owner).orElse(null);
        if (contact == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Contact not found"));
        }

        if (request.getCustomName() != null) {
            contact.setCustomName(request.getCustomName());
        }
        if (request.getIsFavorite() != null) {
            contact.setFavorite(request.getIsFavorite());
        }
        if (request.getIsBlocked() != null) {
            contact.setBlocked(request.getIsBlocked());
        }
        if (request.getIsPinned() != null) {
            contact.setPinned(request.getIsPinned());
        }
        if (request.getIsArchived() != null) {
            contact.setArchived(request.getIsArchived());
        }
        if (request.getIsMuted() != null) {
            contact.setMuted(request.getIsMuted());
        }
        if (request.getLabel() != null) {
            contact.setLabel(request.getLabel().isBlank() ? null : request.getLabel());
        }

        Contact saved = contactRepository.save(contact);
        return ResponseEntity.ok(toDTO(saved));
    }

    // Delete contact
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContact(Principal principal, @PathVariable Long id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        User owner = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (owner == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        Contact contact = contactRepository.findByIdAndOwner(id, owner).orElse(null);
        if (contact == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Contact not found"));
        }

        contactRepository.delete(contact);
        return ResponseEntity.ok(Map.of("message", "Contact deleted successfully"));
    }

    // Helper to convert Contact to DTO
    private ContactDTO toDTO(Contact contact) {
        User cu = contact.getContactUser();
        return new ContactDTO(
                contact.getId(),
                cu.getId(),
                cu.getUsername(),
                cu.getProfilePicUrl(),
                contact.getCustomName(),
                cu.getPhoneNumber(),
                true, // online status is updated dynamically
                contact.isFavorite(),
                contact.isBlocked(),
                contact.isPinned(),
                contact.isArchived(),
                contact.isMuted(),
                contact.getLabel()
        );
    }

    // Request payloads
    public static class AddContactRequest {
        private String phoneNumber;
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    }

    public static class UpdateContactRequest {
        private String customName;
        private Boolean isFavorite;
        private Boolean isBlocked;
        private Boolean isPinned;
        private Boolean isArchived;
        private Boolean isMuted;
        private String label;

        public String getCustomName() { return customName; }
        public void setCustomName(String customName) { this.customName = customName; }
        public Boolean getIsFavorite() { return isFavorite; }
        public void setIsFavorite(Boolean isFavorite) { this.isFavorite = isFavorite; }
        public Boolean getIsBlocked() { return isBlocked; }
        public void setIsBlocked(Boolean isBlocked) { this.isBlocked = isBlocked; }
        public Boolean getIsPinned() { return isPinned; }
        public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }
        public Boolean getIsArchived() { return isArchived; }
        public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
        public Boolean getIsMuted() { return isMuted; }
        public void setIsMuted(Boolean isMuted) { this.isMuted = isMuted; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }
}
