package com.whatsappclone.repo;

import com.whatsappclone.model.PrivacySettings;
import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrivacySettingsRepository extends JpaRepository<PrivacySettings, Long> {
    List<PrivacySettings> findAllByUser(User user);
    List<PrivacySettings> findAllByUserUsername(String username);

    default Optional<PrivacySettings> findByUser(User user) {
        return findAllByUser(user).stream().findFirst();
    }

    default Optional<PrivacySettings> findByUserUsername(String username) {
        return findAllByUserUsername(username).stream().findFirst();
    }
}
