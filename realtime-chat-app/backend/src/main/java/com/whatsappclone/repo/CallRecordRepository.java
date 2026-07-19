package com.whatsappclone.repo;

import com.whatsappclone.model.CallRecord;
import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {
    List<CallRecord> findByCallerOrReceiverOrderByTimestampDesc(User caller, User receiver);
}
