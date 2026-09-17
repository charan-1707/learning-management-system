package com.learnhub.lms.repository;

import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void savesAndFindsByEmail() {
        User user = sampleUser("jane@learnhub.com", UserRole.STUDENT);
        userRepository.saveAndFlush(user);

        Optional<User> found = userRepository.findByEmail("jane@learnhub.com");

        assertThat(found).isPresent();
        assertThat(found.get().getRole()).isEqualTo(UserRole.STUDENT);
        assertThat(found.get().getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    void existsByEmail_isTrueForExistingEmail() {
        userRepository.saveAndFlush(sampleUser("bob@learnhub.com", UserRole.FACULTY));

        assertThat(userRepository.existsByEmail("bob@learnhub.com")).isTrue();
        assertThat(userRepository.existsByEmail("missing@learnhub.com")).isFalse();
    }

    @Test
    void duplicateEmail_isRejectedByUniqueConstraint() {
        userRepository.saveAndFlush(sampleUser("dup@learnhub.com", UserRole.STUDENT));

        assertThatThrownBy(() ->
                userRepository.saveAndFlush(sampleUser("dup@learnhub.com", UserRole.ADMIN)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void countByRole_countsMatchingUsers() {
        userRepository.save(sampleUser("a@learnhub.com", UserRole.STUDENT));
        userRepository.save(sampleUser("b@learnhub.com", UserRole.STUDENT));
        userRepository.save(sampleUser("c@learnhub.com", UserRole.FACULTY));

        assertThat(userRepository.countByRole(UserRole.STUDENT)).isEqualTo(2);
        assertThat(userRepository.countByRole(UserRole.FACULTY)).isEqualTo(1);
    }

    private User sampleUser(String email, UserRole role) {
        User user = new User();
        user.setName("Test User");
        user.setEmail(email);
        user.setPassword("{bcrypt}dummy-hash");
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }
}