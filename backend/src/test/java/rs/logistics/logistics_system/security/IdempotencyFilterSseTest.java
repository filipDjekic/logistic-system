package rs.logistics.logistics_system.security;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;

class IdempotencyFilterSseTest {

    @Test
    void sseGetPassesThroughWithoutCachingOrWrapping() throws Exception {
        IdempotencyService idempotencyService = mock(IdempotencyService.class);
        FilterChain chain = mock(FilterChain.class);
        IdempotencyFilter filter = new IdempotencyFilter(idempotencyService, mock(ObjectMapper.class));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/notifications/my/stream");
        request.addHeader("Accept", "text/event-stream");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(idempotencyService);
    }
}
