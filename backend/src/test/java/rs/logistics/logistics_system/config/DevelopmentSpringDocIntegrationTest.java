package rs.logistics.logistics_system.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationValidationResponse;
import rs.logistics.logistics_system.service.definition.CompanyRegistrationRequestServiceDefinition;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "dev"})
class DevelopmentSpringDocIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @MockitoBean
    private CompanyRegistrationRequestServiceDefinition registrationRequestService;

    @BeforeEach
    void stubBusinessEndpoint() {
        when(registrationRequestService.validateAvailability(any(), any(), any(), any()))
                .thenReturn(new CompanyRegistrationValidationResponse(true, true, true, true, true));
    }

    @Test
    @WithMockUser
    void documentationEndpointsRemainAvailableInDevelopment() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }

    @Test
    void developmentKeepsBusinessApiAndSecurityChainActive() throws Exception {
        assertNotNull(securityFilterChain);

        mockMvc.perform(get("/api/company-registration-requests/validate")
                        .param("companyName", "Development Smoke")
                        .param("adminEmail", "development-smoke@example.test"))
                .andExpect(status().isOk());
    }
}
