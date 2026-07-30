package com.whatsappclone.repo;

import com.whatsappclone.model.ConversationVanishMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationVanishModeRepository extends JpaRepository<ConversationVanishMode, Long> {
    Optional<ConversationVanishMode> findByConversationKey(String conversationKey);
}
