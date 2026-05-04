package rs.logistics.logistics_system.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ErrorResponse;

@Component
@RequiredArgsConstructor
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String IDEMPOTENCY_HEADER = "X-Idempotency-Key";

    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!isProtectedWriteRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String idempotencyKey = request.getHeader(IDEMPOTENCY_HEADER);
        var cached = idempotencyService.getCachedResponse(idempotencyKey);
        if (cached.isPresent()) {
            writeCachedResponse(response, cached.get());
            return;
        }

        try {
            idempotencyService.registerWriteRequest(buildRateLimitKey(request), idempotencyKey);
            ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);
            try {
                filterChain.doFilter(request, wrappedResponse);
                if (wrappedResponse.getStatus() >= 200 && wrappedResponse.getStatus() < 300) {
                    idempotencyService.storeWriteResponse(
                            idempotencyKey,
                            wrappedResponse.getStatus(),
                            wrappedResponse.getContentType(),
                            wrappedResponse.getContentAsByteArray()
                    );
                } else {
                    idempotencyService.clearInProgress(idempotencyKey);
                }
            } catch (RuntimeException | ServletException | IOException ex) {
                idempotencyService.clearInProgress(idempotencyKey);
                throw ex;
            } finally {
                wrappedResponse.copyBodyToResponse();
            }
        } catch (ConflictException ex) {
            writeConflict(response, request, ex.getMessage());
        }
    }

    private boolean isProtectedWriteRequest(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        return uri.startsWith("/api/")
                && ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method));
    }

    private String buildRateLimitKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String principal = authentication == null || authentication.getName() == null
                ? request.getRemoteAddr()
                : authentication.getName();
        return principal + ":" + request.getMethod() + ":" + request.getRequestURI();
    }

    private void writeCachedResponse(HttpServletResponse response, IdempotencyService.CachedWriteResponse cached) throws IOException {
        response.setStatus(cached.status());
        response.setContentType(cached.contentType() == null ? MediaType.APPLICATION_JSON_VALUE : cached.contentType());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getOutputStream().write(cached.body());
    }

    private void writeConflict(HttpServletResponse response, HttpServletRequest request, String message) throws IOException {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                "WRITE_REQUEST_BLOCKED",
                message == null || message.isBlank() ? "Write request blocked" : message,
                request.getRequestURI(),
                List.of()
        );

        response.setStatus(HttpStatus.CONFLICT.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
