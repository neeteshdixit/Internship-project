package com.whatsappclone.repo;

import com.whatsappclone.model.AiSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiSettingsRepository extends JpaRepository<AiSettings, Long> {
}
