package rs.logistics.logistics_system.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

class OverlordWriteProtectionFilterTest {

    private final OncePerRequestFilter filter =
            new OverlordWriteProtectionFilter(
                    new ObjectMapper().findAndRegisterModules(),
                    new OverlordAccessPolicy()
            );

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void overlordCanReadEveryResource() throws Exception {
        authenticate("ROLE_OVERLORD");
        MockHttpServletResponse response = execute("GET", "/api/warehouses");

        assertEquals(204, response.getStatus());
    }

    @Test
    void overlordCannotMutateReadOnlyResource() throws Exception {
        authenticate("ROLE_OVERLORD");
        MockHttpServletResponse response = execute("POST", "/api/warehouses");

        assertEquals(403, response.getStatus());
    }

    @Test
    void overlordCanMutateAllAccessResources() throws Exception {
        authenticate("ROLE_OVERLORD");

        assertEquals(204, execute("PATCH", "/api/companies/7").getStatus());
        assertEquals(204, execute("POST", "/api/company-registration-requests/7/approve").getStatus());
        assertEquals(204, execute("DELETE", "/api/notifications/7").getStatus());
    }

    @Test
    void otherRolesAreUnaffected() throws Exception {
        authenticate("ROLE_WAREHOUSE_MANAGER");
        MockHttpServletResponse response = execute("POST", "/api/warehouses");

        assertEquals(204, response.getStatus());
    }

    private MockHttpServletResponse execute(String method, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, (ignoredRequest, downstreamResponse) ->
                ((MockHttpServletResponse) downstreamResponse).setStatus(204));
        return response;
    }

    private void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "test-user",
                        null,
                        List.of(new SimpleGrantedAuthority(authority))
                )
        );
    }
}
