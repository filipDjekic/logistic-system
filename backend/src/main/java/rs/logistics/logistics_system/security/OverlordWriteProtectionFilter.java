package rs.logistics.logistics_system.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.exception.ErrorResponse;
import rs.logistics.logistics_system.observability.RequestCorrelation;

@Component
@RequiredArgsConstructor
public class OverlordWriteProtectionFilter extends OncePerRequestFilter {

    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private static final List<String> WRITE_ALLOWED_PATHS = List.of(
            "/api/companies",
            "/api/company-registration-requests",
            "/api/notifications"
    );

    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (isAuthenticatedOverlord(authentication)
                && !READ_METHODS.contains(request.getMethod())
                && !isWriteAllowed(request.getRequestURI())) {
            writeForbidden(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthenticatedOverlord(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(authority -> "ROLE_OVERLORD".equals(authority.getAuthority()));
    }

    private boolean isWriteAllowed(String path) {
        return WRITE_ALLOWED_PATHS.stream()
                .anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    private void writeForbidden(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Object traceIdValue = request.getAttribute(RequestCorrelation.TRACE_ID_ATTRIBUTE);
        String traceId = traceIdValue == null ? null : traceIdValue.toString();
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "FORBIDDEN",
                "OVERLORD has read-only access to this resource",
                request.getRequestURI(),
                traceId,
                List.of()
        );
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        if (traceId != null) {
            response.setHeader(RequestCorrelation.REQUEST_ID_HEADER, traceId);
        }
        objectMapper.writeValue(response.getWriter(), error);
    }
}
