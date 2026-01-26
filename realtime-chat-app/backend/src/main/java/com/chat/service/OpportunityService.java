package com.chat.service;

import com.chat.model.Opportunity;
import com.chat.model.User;
import com.chat.repo.OpportunityRepository;
import com.chat.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;

    public Opportunity createOpportunity(Long customerId, Long ownerId, String title, 
                                        BigDecimal value, LocalDateTime expectedCloseDate) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Opportunity opportunity = Opportunity.builder()
                .customer(customer)
                .owner(owner)
                .title(title)
                .value(value)
                .expectedCloseDate(expectedCloseDate)
                .stage("NEW")
                .probability(0)
                .build();

        log.info("Opportunity created: {} by user: {}", title, owner.getUsername());
        return opportunityRepository.save(opportunity);
    }

    public Opportunity getOpportunityById(Long id) {
        return opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found with id: " + id));
    }

    public List<Opportunity> getCustomerOpportunities(Long customerId) {
        return opportunityRepository.findByCustomerId(customerId);
    }

    public List<Opportunity> getOwnerOpportunities(Long ownerId) {
        return opportunityRepository.findByOwnerId(ownerId);
    }

    public List<Opportunity> getOpportunitiesByStage(String stage) {
        return opportunityRepository.findByStage(stage);
    }

    public List<Opportunity> getClosedOpportunities() {
        return opportunityRepository.findClosedOpportunities();
    }

    public Page<Opportunity> getOpenOpportunities(Pageable pageable) {
        return opportunityRepository.findOpenOpportunities(pageable);
    }

    public Opportunity updateOpportunityStage(Long id, String newStage, Integer probability) {
        Opportunity opportunity = getOpportunityById(id);
        opportunity.setStage(newStage);
        opportunity.setProbability(probability);
        opportunity.setUpdatedAt(LocalDateTime.now());
        log.info("Opportunity {} stage updated to: {}", id, newStage);
        return opportunityRepository.save(opportunity);
    }

    public Opportunity winOpportunity(Long id, BigDecimal actualValue) {
        Opportunity opportunity = getOpportunityById(id);
        opportunity.setStage("WON");
        opportunity.setActualValue(actualValue);
        opportunity.setProbability(100);
        opportunity.setUpdatedAt(LocalDateTime.now());
        log.info("Opportunity {} marked as WON", id);
        return opportunityRepository.save(opportunity);
    }

    public Opportunity loseOpportunity(Long id, String reason) {
        Opportunity opportunity = getOpportunityById(id);
        opportunity.setStage("LOST");
        opportunity.setLostReason(reason);
        opportunity.setProbability(0);
        opportunity.setUpdatedAt(LocalDateTime.now());
        log.info("Opportunity {} marked as LOST", id);
        return opportunityRepository.save(opportunity);
    }

    public Opportunity updateOpportunity(Long id, Opportunity details) {
        Opportunity opportunity = getOpportunityById(id);
        opportunity.setTitle(details.getTitle());
        opportunity.setDescription(details.getDescription());
        opportunity.setValue(details.getValue());
        opportunity.setExpectedCloseDate(details.getExpectedCloseDate());
        opportunity.setUpdatedAt(LocalDateTime.now());
        log.info("Opportunity {} updated", id);
        return opportunityRepository.save(opportunity);
    }

    public void deleteOpportunity(Long id) {
        opportunityRepository.deleteById(id);
        log.info("Opportunity deleted: {}", id);
    }

    public Double getTotalWonValue() {
        return opportunityRepository.getTotalWonValue();
    }

    public Double getTotalPipelineValue() {
        return opportunityRepository.getTotalPipelineValue();
    }
}
