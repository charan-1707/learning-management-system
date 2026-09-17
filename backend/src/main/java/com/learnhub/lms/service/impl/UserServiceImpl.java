package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.UserRequest;
import com.learnhub.lms.dto.response.UserResponse;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;
import com.learnhub.lms.exception.DuplicateResourceException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityMapper mapper;

    @Override
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User with email '" + request.getEmail() + "' already exists.");
        }
        User user = new User();
        applyRequest(user, request);
        return mapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return mapper.toUserResponses(userRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return mapper.toUserResponse(findOrThrow(id));
    }

    @Override
    public UserResponse updateUser(Long id, UserRequest request) {
        User user = findOrThrow(id);
        String newEmail = request.getEmail() == null ? null : normalizeEmail(request.getEmail());
        if (newEmail != null && !newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
            throw new DuplicateResourceException("User with email '" + newEmail + "' already exists.");
        }
        applyRequest(user, request);
        return mapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateRole(Long id, UserRole role) {
        User user = findOrThrow(id);
        user.setRole(role);
        return mapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateStatus(Long id, UserStatus status) {
        User user = findOrThrow(id);
        user.setStatus(status);
        return mapper.toUserResponse(userRepository.save(user));
    }

    private void applyRequest(User user, UserRequest request) {
        user.setName(request.getName());
        user.setEmail(normalizeEmail(request.getEmail()));
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
}