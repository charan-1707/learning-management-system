package com.learnhub.lms.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

  Optional<EmailOtp> findFirstByUser_IdAndConsumedAtIsNullOrderByCreatedAtDesc(Long userId);

  List<EmailOtp> findByUser_IdAndConsumedAtIsNull(Long userId);

  /* Attempt bookkeeping commits in its own transaction: the wrong-code path
     below always ends in a throw, which would roll a same-TX increment back
     and make lockout untriggerable. */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @Modifying
  @Query("UPDATE EmailOtp r SET r.attempts = r.attempts + 1 WHERE r.id = :id")
  void incrementAttempts(@Param("id") Long id);

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @Modifying
  @Query("UPDATE EmailOtp r SET r.consumedAt = CURRENT_TIMESTAMP WHERE r.id = :id")
  void consumeById(@Param("id") Long id);
}
