package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.LoginRequest;
import com.learnhub.lms.dto.request.ProfileUpdateRequest;
import com.learnhub.lms.dto.request.RegisterRequest;
import com.learnhub.lms.dto.response.AuthResponse;
import com.learnhub.lms.dto.response.UserResponse;
import com.learnhub.lms.security.SecurityUtils;
import com.learnhub.lms.service.AuthService;
import com.learnhub.lms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public authentication endpoints. {@code /api/auth/register} always creates a
 * student account; faculty/admin accounts are provisioned by an admin via the
 * users API.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public UserResponse me() {
        Long currentUserId = SecurityUtils.currentUserId();
        if (currentUserId == null) {
            throw new BadCredentialsException("Not authenticated.");
        }
        return userService.getUserById(currentUserId);
    }

    @PutMapping("/me")
    public UserResponse updateMe(@Valid @RequestBody ProfileUpdateRequest request) {
        Long currentUserId = SecurityUtils.currentUserId();
        if (currentUserId == null) {
            throw new BadCredentialsException("Not authenticated.");
        }
        return userService.updateSelf(currentUserId, request);
    }
}