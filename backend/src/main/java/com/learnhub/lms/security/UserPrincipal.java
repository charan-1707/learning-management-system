package com.learnhub.lms.security;

import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Security adapter wrapping a {@link User} so the filter chain and
 * controllers can work with the authenticated principal. The Spring Security
 * username maps to the user's email; role/status are surfaced directly so
 * controllers can apply ownership rules.
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final UserRole role;
    private final UserStatus status;

    public UserPrincipal(Long id, String email, String password, UserRole role, UserStatus status) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
        this.status = status;
    }

    public static UserPrincipal from(User user) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getRole(),
                user.getStatus());
    }

    public boolean isStudent() {
        return role == UserRole.STUDENT;
    }

    public boolean isFaculty() {
        return role == UserRole.FACULTY;
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}