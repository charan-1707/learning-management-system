package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.LoginRequest;
import com.learnhub.lms.dto.request.RegisterRequest;
import com.learnhub.lms.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}