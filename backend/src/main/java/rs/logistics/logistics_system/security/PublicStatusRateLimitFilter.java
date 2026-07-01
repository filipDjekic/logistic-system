package rs.logistics.logistics_system.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import rs.logistics.logistics_system.exception.ErrorResponse;
import rs.logistics.logistics_system.observability.RequestCorrelation;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class PublicStatusRateLimitFilter extends OncePerRequestFilter {

    private static final String STATUS_PATH_PREFIX = "/api/company-registration-requests/status/";
    private static final int REQUESTS_PER_MINUTE = 30;

    private final ObjectMapper objectMapper;
    private final Map<String, RateWindow> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!isPublicStatusLookup(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = clientKey(request);
        Instant now = Instant.now();
        RateWindow window = windows.compute(key, (ignored, current) -> {
            if (current == null || current.windowStart.plusSeconds(60).isBefore(now)) {
                return new RateWindow(now, 1);
            }
            current.count++;
            return current;
        });
        cleanup(now);

        if (window.count > REQUESTS_PER_MINUTE) {
            writeTooManyRequests(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicStatusLookup(HttpServletRequest request) {
        return "GET".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI() != null
                && request.getRequestURI().startsWith(STATUS_PATH_PREFIX);
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private void cleanup(Instant now) {
        windows.entrySet().removeIf(entry -> entry.getValue().windowStart.plusSeconds(120).isBefore(now));
    }

    private void writeTooManyRequests(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Object traceId = request.getAttribute(RequestCorrelation.TRACE_ID_ATTRIBUTE);
        String traceIdValue = traceId == null ? null : traceId.toString();
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                "PUBLIC_STATUS_RATE_LIMITED",
                "Too many status checks. Try again later.",
                request.getRequestURI(),
                traceIdValue,
                List.of()
        );

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader(RequestCorrelation.REQUEST_ID_HEADER, traceIdValue);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }

    private static class RateWindow {
        private final Instant windowStart;
        private int count;

        private RateWindow(Instant windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
