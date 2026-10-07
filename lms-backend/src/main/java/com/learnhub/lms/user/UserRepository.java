package com.learnhub.lms.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  Optional<User> findByAvatarUrl(String avatarUrl);

  long countByRole(Role role);

  /** Admin user search: query matches name/email (case-insensitive), optional role+status. */
  @Query("SELECT u FROM User u WHERE (:query IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))"
      + " OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))"
      + " AND (:role IS NULL OR u.role = :role)"
      + " AND (:status IS NULL OR u.status = :status)")
  Page<User> search(@Param("query") String query, @Param("role") Role role,
      @Param("status") UserStatus status, Pageable pageable);
}
