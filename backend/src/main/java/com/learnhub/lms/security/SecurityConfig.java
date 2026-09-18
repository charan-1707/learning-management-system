package com.learnhub.lms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.lms.exception.ApiErrorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Stateless JWT-aware security configuration.
 *
 * <p>Endpoint policy (first matching rule wins, so specific matchers are
 * declared before generic ones):</p>
 * <ul>
 *   <li>{@code PUBLIC} – login/register, and GET reads of published catalog
 *       content (courses/modules/lessons/quizzes/assignments/announcements).</li>
 *   <li>{@code AUTHENTICATED} – enrollment, progress, lesson completion, quiz
 *       attempts, submissions, notifications, own attendance.</li>
 *   <li>{@code FACULTY/ADMIN} – content management (creates/updates/deletes),
 *       grading, attendance marking, management reads.</li>
 *   <li>{@code ADMIN} – user management.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .anonymous(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        // --- STATIC FRONTEND (served from resources/static) ---
                        .requestMatchers("/", "/index.html", "/favicon.ico",
                                "/css/**", "/js/**", "/pages/**", "/assets/**").permitAll()

                        // --- PUBLIC ---
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // --- FACULTY/ADMIN management (before broad rules below) ---
                        .requestMatchers(HttpMethod.GET, "/api/courses/*/attendance").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/courses/faculty/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/courses/status/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/quizzes/*/questions").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/enrollments/course/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/assignments/*/submissions").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/submissions/*/grade").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/attendance").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/notifications/**").hasAnyRole("FACULTY", "ADMIN")

                        // --- AUTHENTICATED: self-service ---
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/courses/*/enrollment").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/courses/*/enroll").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.DELETE, "/api/courses/*/enroll").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/api/students/me/grades").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/api/students/me/attendance").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/api/students/me/courses").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/api/instructors/me/courses").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/*/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}").authenticated()
                        .requestMatchers("/api/enrollments/**").authenticated()
                        .requestMatchers("/api/progress/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/lessons/*/complete").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/quizzes/*/attempts").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/quizzes/*/attempts").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/attempts/*/submit").authenticated()
                        .requestMatchers("/api/submissions/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/students/*/attendance").authenticated()

                        // --- ADMIN: user management ---
                        .requestMatchers(HttpMethod.GET, "/api/admin/stats").hasRole("ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // --- FACULTY/ADMIN: content management ---
                        .requestMatchers(HttpMethod.POST, "/api/courses/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/courses/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/courses/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/courses/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/modules/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/modules/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/modules/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/lessons/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/lessons/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/lessons/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/quizzes/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/quizzes/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/quizzes/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/assignments/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/assignments/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/assignments/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/announcements/**").hasAnyRole("FACULTY", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/announcements/**").hasAnyRole("FACULTY", "ADMIN")

                        // --- PUBLIC: catalog reads ---
                        .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/modules/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/lessons/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/quizzes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/assignments/**").permitAll()

                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedEntryPoint(objectMapper))
                        .accessDeniedHandler(accessDeniedHandler(objectMapper)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    private AuthenticationEntryPoint unauthorizedEntryPoint(ObjectMapper objectMapper) {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(),
                    new ApiErrorResponse("Unauthorized", "Authentication is required.", 401));
        };
    }

    private AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(),
                    new ApiErrorResponse("Forbidden", "You do not have permission to perform this action.", 403));
        };
    }
}