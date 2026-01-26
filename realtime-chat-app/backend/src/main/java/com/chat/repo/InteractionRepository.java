package com.chat.repo;

import com.chat.model.Interaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, Long> {

    @Query("SELECT i FROM Interaction i WHERE i.customer.id = :customerId ORDER BY i.interactionDate DESC")
    List<Interaction> findByCustomerId(Long customerId);

    @Query("SELECT i FROM Interaction i WHERE i.user.id = :userId ORDER BY i.interactionDate DESC")
    List<Interaction> findByUserId(Long userId);

    List<Interaction> findByType(String type);

    @Query("SELECT i FROM Interaction i WHERE i.interactionDate BETWEEN :startDate AND :endDate")
    List<Interaction> findByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT i FROM Interaction i WHERE i.customer.id = :customerId AND i.user.id = :userId")
    Page<Interaction> findCustomerUserInteractions(Long customerId, Long userId, Pageable pageable);
}
