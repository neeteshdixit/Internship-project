package com.chat.service;

import com.chat.model.Interaction;
import com.chat.model.User;
import com.chat.repo.InteractionRepository;
import com.chat.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InteractionService {

    private final InteractionRepository interactionRepository;
    private final UserRepository userRepository;

    public Interaction recordInteraction(Long customerId, Long userId, String type, String notes) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Interaction interaction = Interaction.builder()
                .customer(customer)
                .user(user)
                .type(type)
                .notes(notes)
                .interactionDate(LocalDateTime.now())
                .build();

        log.info("Recording interaction {} with customer {} by user {}", 
                type, customer.getUsername(), user.getUsername());
        return interactionRepository.save(interaction);
    }

    public Interaction getInteractionById(Long id) {
        return interactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interaction not found with id: " + id));
    }

    public List<Interaction> getCustomerInteractions(Long customerId) {
        return interactionRepository.findByCustomerId(customerId);
    }

    public List<Interaction> getUserInteractions(Long userId) {
        return interactionRepository.findByUserId(userId);
    }

    public List<Interaction> getInteractionsByType(String type) {
        return interactionRepository.findByType(type);
    }

    public Interaction updateInteraction(Long id, String type, String notes, String outcome) {
        Interaction interaction = getInteractionById(id);
        interaction.setType(type);
        interaction.setNotes(notes);
        interaction.setOutcome(outcome);
        log.info("Interaction updated: {}", id);
        return interactionRepository.save(interaction);
    }

    public void setFollowUpDate(Long id, LocalDateTime nextFollowUp) {
        Interaction interaction = getInteractionById(id);
        interaction.setNextFollowUpDate(nextFollowUp);
        interactionRepository.save(interaction);
    }

    public void deleteInteraction(Long id) {
        interactionRepository.deleteById(id);
        log.info("Interaction deleted: {}", id);
    }
}
