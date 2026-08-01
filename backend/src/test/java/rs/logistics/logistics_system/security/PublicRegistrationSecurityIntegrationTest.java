package rs.logistics.logistics_system.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import rs.logistics.logistics_system.dto.response.CompanyRegistrationValidationResponse;
import rs.logistics.logistics_system.service.definition.CompanyRegistrationRequestServiceDefinition;
import rs.logistics.logistics_system.testsupport.IntegrationTestSupport;

class PublicRegistrationSecurityIntegrationTest extends IntegrationTestSupport {

    @MockitoBean
    private CompanyRegistrationRequestServiceDefinition registrationRequestService;

    @BeforeEach
    void stubValidation() {
        when(registrationRequestService.validateAvailability(any(), any(), any(), any()))
                .thenReturn(mock(CompanyRegistrationValidationResponse.class));
    }

    @Test
    void anonymousUserCanValidateRegistrationAvailability() throws Exception {
        mockMvc.perform(get("/api/company-registration-requests/validate")
                        .param("companyName", "Available Logistics")
                        .param("adminEmail", "available@example.test"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousUserCannotListRegistrationRequests() throws Exception {
        mockMvc.perform(get("/api/company-registration-requests"))
                .andExpect(status().isForbidden());
    }
}
