package rs.logistics.logistics_system.observability;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String traceId = resolveTraceId(request);

        request.setAttribute(RequestCorrelation.TRACE_ID_ATTRIBUTE, traceId);
        response.setHeader(RequestCorrelation.REQUEST_ID_HEADER, traceId);
        MDC.put(RequestCorrelation.MDC_TRACE_ID, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(RequestCorrelation.MDC_TRACE_ID);
        }
    }

    private String resolveTraceId(HttpServletRequest request) {
        String requestId = request.getHeader(RequestCorrelation.REQUEST_ID_HEADER);
        if (requestId != null && !requestId.isBlank()) {
            return sanitize(requestId);
        }

        return UUID.randomUUID().toString();
    }

    private String sanitize(String requestId) {
        String trimmed = requestId.trim();
        if (trimmed.length() > 128) {
            return trimmed.substring(0, 128);
        }

        return trimmed;
    }
}
