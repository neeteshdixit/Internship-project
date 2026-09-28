package com.whatsappclone.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class UserDeduplicationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            log.info("Checking for duplicate phone numbers in users database table...");

            // Find duplicate phone numbers (non-null and non-empty)
            List<String> duplicatePhones = jdbcTemplate.queryForList(
                "SELECT phone_number FROM users " +
                "WHERE phone_number IS NOT NULL AND TRIM(phone_number) != '' " +
                "GROUP BY phone_number HAVING COUNT(*) > 1",
                String.class
            );

            if (duplicatePhones.isEmpty()) {
                log.info("No duplicate phone numbers found in users database.");
            } else {
                log.warn("Found {} duplicate phone number(s) in users table: {}", duplicatePhones.size(), duplicatePhones);

                for (String phone : duplicatePhones) {
                    // Fetch IDs ordered by oldest account first (id ASC)
                    List<Long> userIds = jdbcTemplate.queryForList(
                        "SELECT id FROM users WHERE phone_number = ? ORDER BY id ASC",
                        Long.class,
                        phone
                    );

                    if (userIds.size() > 1) {
                        Long primaryId = userIds.get(0);
                        List<Long> duplicateIds = userIds.subList(1, userIds.size());

                        log.info("Phone '{}': Retaining primary user ID={}, deleting duplicate user IDs={}", phone, primaryId, duplicateIds);

                        for (Long dupId : duplicateIds) {
                            cleanupDuplicateUser(dupId, primaryId);
                        }
                    }
                }
                log.info("Database deduplication of users by phone number completed successfully.");
            }

            // Ensure PostgreSQL UNIQUE constraint on users.phone_number
            try {
                jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT uk_users_phone_number UNIQUE (phone_number)");
                log.info("UNIQUE constraint uk_users_phone_number successfully established on users(phone_number).");
            } catch (Exception ignored) {
                // Constraint already exists or handled by Hibernate
            }

        } catch (Exception e) {
            log.error("Notice during user deduplication runner: {}", e.getMessage());
        }
    }

    private void cleanupDuplicateUser(Long dupId, Long primaryId) {
        // 1. Delete privacy settings
        safeExecute("DELETE FROM privacy_settings WHERE user_id = ?", dupId);

        // 2. Delete contacts (both as owner and as contact)
        safeExecute("DELETE FROM contacts WHERE owner_id = ? OR contact_user_id = ?", dupId, dupId);

        // 3. Remove from group memberships
        safeExecute("DELETE FROM group_members WHERE user_id = ?", dupId);

        // 4. Reassign chat groups created by duplicate user to primary user
        safeExecute("UPDATE chat_groups SET created_by_id = ? WHERE created_by_id = ?", primaryId, dupId);

        // 5. Reassign or delete messages
        safeExecute("UPDATE messages SET sender_id = ? WHERE sender_id = ?", primaryId, dupId);
        safeExecute("UPDATE messages SET recipient_id = ? WHERE recipient_id = ?", primaryId, dupId);

        // 6. Delete statuses
        safeExecute("DELETE FROM statuses WHERE user_id = ?", dupId);

        // 7. Delete AI settings
        safeExecute("DELETE FROM ai_settings WHERE user_id = ?", dupId);

        // 8. Delete calls
        safeExecute("DELETE FROM call_records WHERE caller_id = ? OR receiver_id = ?", dupId, dupId);

        // 9. Delete scheduled messages
        safeExecute("DELETE FROM scheduled_messages WHERE sender_id = ? OR receiver_id = ?", dupId, dupId);

        // 10. Delete conversation vanish mode
        safeExecute("DELETE FROM conversation_vanish_mode WHERE user1_id = ? OR user2_id = ?", dupId, dupId);

        // 11. Finally delete the duplicate user record
        safeExecute("DELETE FROM users WHERE id = ?", dupId);

        log.info("Successfully deleted duplicate user record with ID: {}", dupId);
    }

    private void safeExecute(String sql, Object... params) {
        try {
            jdbcTemplate.update(sql, params);
        } catch (Exception ex) {
            log.debug("SQL update ignored: {} -> {}", sql, ex.getMessage());
        }
    }
}
