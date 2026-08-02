package rs.logistics.logistics_system.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.DispatcherType;
import rs.logistics.logistics_system.exception.ErrorResponse;
import rs.logistics.logistics_system.observability.RequestCorrelation;
import rs.logistics.logistics_system.security.IdempotencyFilter;
import rs.logistics.logistics_system.security.JwtAuthenticationFilter;
import rs.logistics.logistics_system.security.OverlordWriteProtectionFilter;
import rs.logistics.logistics_system.security.PublicStatusRateLimitFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OverlordWriteProtectionFilter overlordWriteProtectionFilter;
    private final IdempotencyFilter idempotencyFilter;
    private final PublicStatusRateLimitFilter publicStatusRateLimitFilter;
    private final ObjectMapper objectMapper;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(contentType -> {})
                )
                .authorizeHttpRequests(auth -> auth
                        // The initial REQUEST is authenticated below and method security
                        // authorizes the controller before an SSE response is opened.
                        // A container ASYNC redispatch only completes that same response;
                        // re-authorizing it after the response is committed can no longer
                        // produce a meaningful 401/403 response.
                        .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/login",
                                "/api/company-registration-requests",
                                "/api/company-registration-requests/validate",
                                "/api/company-registration-requests/status/**",
                                "/api/countries/**",
                                "/api/cities/**",
                                "/api/timezones/**").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(sessionManagement ->
                        sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                writeSecurityError(request, response, HttpStatus.UNAUTHORIZED,
                                        "UNAUTHORIZED", "Authentication is required"))
                        .accessDeniedHandler((request, response, exception) ->
                                writeSecurityError(request, response, HttpStatus.FORBIDDEN,
                                        "FORBIDDEN", "Access denied"))
                )
                .addFilterBefore(
                        publicStatusRateLimitFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class
                )
                .addFilterAfter(
                        overlordWriteProtectionFilter,
                        JwtAuthenticationFilter.class
                )
                .addFilterAfter(
                        idempotencyFilter,
                        OverlordWriteProtectionFilter.class
                );
        return http.build();
    }

    private void writeSecurityError(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpStatus status,
            String code,
            String message
    ) throws IOException {
        Object traceIdValue = request.getAttribute(RequestCorrelation.TRACE_ID_ATTRIBUTE);
        String traceId = traceIdValue == null ? null : traceIdValue.toString();
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI(),
                traceId,
                List.of()
        );
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        if (traceId != null) {
            response.setHeader(RequestCorrelation.REQUEST_ID_HEADER, traceId);
        }
        objectMapper.writeValue(response.getWriter(), error);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .collect(Collectors.toList());

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Accept",
                "Authorization",
                "Content-Disposition",
                "Content-Type",
                "X-Idempotency-Key",
                "X-Request-Id",
                "X-Requested-With"
        ));
        configuration.setExposedHeaders(List.of(
                "Content-Disposition",
                "X-Request-Id"
        ));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
