package com.learnhub.lms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Core application beans.
 *
 * <p>The {@link PasswordEncoder} is shared between authentication
 * (see {@code security} package for the JWT filter chain and endpoint rules)
 * and the admin user-provisioning service.</p>
 */
@Configuration
public class BeansConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}