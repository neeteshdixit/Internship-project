package com.chat.repo;

import com.chat.model.Opportunity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {

    @Query("SELECT o FROM Opportunity o WHERE o.customer.id = :customerId")
    List<Opportunity> findByCustomerId(Long customerId);

    @Query("SELECT o FROM Opportunity o WHERE o.owner.id = :ownerId")
    List<Opportunity> findByOwnerId(Long ownerId);

    List<Opportunity> findByStage(String stage);

    @Query("SELECT o FROM Opportunity o WHERE o.stage IN ('WON', 'LOST') ORDER BY o.updatedAt DESC")
    List<Opportunity> findClosedOpportunities();

    @Query("SELECT o FROM Opportunity o WHERE o.stage NOT IN ('WON', 'LOST') ORDER BY o.expectedCloseDate ASC")
    Page<Opportunity> findOpenOpportunities(Pageable pageable);

    @Query("SELECT SUM(o.value) FROM Opportunity o WHERE o.stage = 'WON'")
    Double getTotalWonValue();

    @Query("SELECT SUM(o.value) FROM Opportunity o WHERE o.stage NOT IN ('WON', 'LOST')")
    Double getTotalPipelineValue();
}
