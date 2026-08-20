package com.whatsappclone.repo;

import com.whatsappclone.model.Contact;
import com.whatsappclone.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    // Get all contacts owned by a user
    List<Contact> findByOwner(User owner);

    // Find contacts between a specific owner and contact user
    List<Contact> findAllByOwnerAndContactUser(User owner, User contactUser);

    // Check whether a contact relationship already exists
    boolean existsByOwnerAndContactUser(User owner, User contactUser);

    // Find a specific contact belonging to an owner
    Optional<Contact> findByIdAndOwner(Long id, User owner);

    // Account deletion:
    // Delete all contacts where this user is the owner
    @Transactional
    void deleteAllByOwner(User owner);

    // Account deletion:
    // Delete all contacts where this user is referenced as contactUser
    @Transactional
    void deleteAllByContactUser(User contactUser);

    // Convenience method for finding a contact relationship
    default Optional<Contact> findByOwnerAndContactUser(
            User owner,
            User contactUser) {

        return findAllByOwnerAndContactUser(owner, contactUser)
                .stream()
                .findFirst();
    }
}