package com.whatsappclone.repo;

import com.whatsappclone.model.Contact;
import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    List<Contact> findByOwner(User owner);
    List<Contact> findAllByOwnerAndContactUser(User owner, User contactUser);
    boolean existsByOwnerAndContactUser(User owner, User contactUser);
    Optional<Contact> findByIdAndOwner(Long id, User owner);

    default Optional<Contact> findByOwnerAndContactUser(User owner, User contactUser) {
        return findAllByOwnerAndContactUser(owner, contactUser).stream().findFirst();
    }
}
