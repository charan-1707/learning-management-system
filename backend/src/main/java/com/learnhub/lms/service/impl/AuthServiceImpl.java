package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.LoginRequest;
import com.learnhub.lms.dto.request.RegisterRequest;
import com.learnhub.lms.dto.response.AuthResponse;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.DuplicateResourceException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.security.JwtService;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EntityMapper mapper;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email '" + email + "' already exists.");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.STUDENT);
        user.setStatus(UserStatus.ACTIVE);
        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizeEmail(request.email()), request.password()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessRuleException("Your account is not active.");
        }
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(UserPrincipal.from(user));
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs(), mapper.toUserResponse(user));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}