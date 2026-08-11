package rs.logistics.logistics_system.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

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

    private final ObjectMapper objectMapper;
    private final OverlordAccessPolicy overlordAccessPolicy;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (isAuthenticatedOverlord(authentication)
                && !overlordAccessPolicy.canAccess(request.getMethod(), request.getRequestURI())) {
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

    private void writeForbidden(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Object traceIdValue = request.getAttribute(RequestCorrelation.TRACE_ID_ATTRIBUTE);
        String traceId = traceIdValue == null ? null : traceIdValue.toString();
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "FORBIDDEN",
                "OVERLORD has read-only access to operational resources",
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
