package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.ProfileUpdateRequest;
import com.learnhub.lms.dto.request.UserRequest;
import com.learnhub.lms.dto.response.UserResponse;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;

import java.util.List;

public interface UserService {

    UserResponse createUser(UserRequest request);

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse updateUser(Long id, UserRequest request);

    UserResponse updateSelf(Long id, ProfileUpdateRequest request);

    UserResponse updateRole(Long id, UserRole role);

    UserResponse updateStatus(Long id, UserStatus status);
}