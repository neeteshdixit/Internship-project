package com.whatsappclone.service;

import com.whatsappclone.model.PrivacySettings;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.ContactRepository;
import com.whatsappclone.repo.PrivacySettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PrivacyService {

    private final PrivacySettingsRepository privacySettingsRepository;
    private final ContactRepository contactRepository;

    public PrivacySettings getSettingsForUser(User user) {
        return privacySettingsRepository.findByUser(user)
                .orElseGet(() -> {
                    PrivacySettings defaults = PrivacySettings.builder().user(user).build();
                    return privacySettingsRepository.save(defaults);
                });
    }

    public boolean canSeeLastSeen(User target, User viewer) {
        if (target.getId().equals(viewer.getId())) return true;
        PrivacySettings settings = getSettingsForUser(target);
        String visibility = settings.getLastSeenVisibility();
        if ("EVERYONE".equalsIgnoreCase(visibility)) return true;
        if ("CONTACTS".equalsIgnoreCase(visibility)) {
            return contactRepository.existsByOwnerAndContactUser(target, viewer);
        }
        return false; // NOBODY
    }

    public boolean canSeeOnline(User target, User viewer) {
        if (target.getId().equals(viewer.getId())) return true;
        PrivacySettings settings = getSettingsForUser(target);
        String onlineVis = settings.getOnlineVisibility();
        if ("EVERYONE".equalsIgnoreCase(onlineVis)) return true;
        // SAME_AS_LAST_SEEN
        return canSeeLastSeen(target, viewer);
    }

    public boolean canSeeProfilePhoto(User target, User viewer) {
        if (target.getId().equals(viewer.getId())) return true;
        PrivacySettings settings = getSettingsForUser(target);
        String visibility = settings.getProfilePhotoVisibility();
        if ("EVERYONE".equalsIgnoreCase(visibility)) return true;
        if ("CONTACTS".equalsIgnoreCase(visibility)) {
            return contactRepository.existsByOwnerAndContactUser(target, viewer);
        }
        return false; // NOBODY
    }

    public boolean canSeeAbout(User target, User viewer) {
        if (target.getId().equals(viewer.getId())) return true;
        PrivacySettings settings = getSettingsForUser(target);
        String visibility = settings.getAboutVisibility();
        if ("EVERYONE".equalsIgnoreCase(visibility)) return true;
        if ("CONTACTS".equalsIgnoreCase(visibility)) {
            return contactRepository.existsByOwnerAndContactUser(target, viewer);
        }
        return false; // NOBODY
    }
}
