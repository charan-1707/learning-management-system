package com.learnhub.lms.security;

import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Phase 2 filter: Bearer JWT → DB-backed principal. Unknown users stay
 * anonymous; <em>suspended</em> users are stopped here with
 * {@code 403 {ok:false, suspended:true}} on every call (plan §7).
 * Invalid tokens never throw — protected paths fall through to the 401 entry
 * point, public paths still pass.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final UserRepository users;

  public JwtAuthFilter(JwtService jwtService, UserRepository users) {
    this.jwtService = jwtService;
    this.users = users;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    String token = null;
    if (header != null && header.startsWith("Bearer ")) {
      token = header.substring(7);
    } else if (request.getRequestURI() != null && request.getRequestURI().startsWith("/api/files/")
        && request.getParameter("token") != null) {
      // <img>/background downloads cannot send Authorization headers — accept the
      // same JWT as a query param on file URLs only (prod: prefer short-lived URLs).
      token = request.getParameter("token");
    }
    if (token != null && !token.isBlank()) {
      try {
        Claims claims = jwtService.parse(token);
        String userId = claims.getSubject();
        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
          User user = users.findById(Long.valueOf(userId)).orElse(null);
          if (user == null) {
            SecurityContextHolder.clearContext();
          } else if (user.getStatus() != null
              && user.getStatus().name().equals("suspended")) {
            response.setStatus(403);
            response.setContentType("application/json");
            response.getWriter().write("{\"ok\":false,\"error\":\"Account suspended.\",\"suspended\":true}");
            return;
          } else {
            String role = user.getRole() == null ? "student" : user.getRole().name();
            var principal = new org.springframework.security.core.userdetails.User(
                String.valueOf(user.getId()), "{noop}jwt",
                List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())));
            var auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
          }
        }
      } catch (JwtException | IllegalArgumentException ex) {
        SecurityContextHolder.clearContext();
      }
    }
    chain.doFilter(request, response);
  }
}
