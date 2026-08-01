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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.servlet.resource.ResourceHttpRequestHandler;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationValidationResponse;
import rs.logistics.logistics_system.service.definition.CompanyRegistrationRequestServiceDefinition;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.handler;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "prod"})
class ProductionSpringDocIntegrationTest {

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
    void documentationEndpointsAreNotRegisteredInProduction() throws Exception {
        assertDocumentationResourceIsNotRegistered("/v3/api-docs");
        assertDocumentationResourceIsNotRegistered("/v3/api-docs/");
        assertDocumentationResourceIsNotRegistered("/swagger-ui.html");
        assertDocumentationResourceIsNotRegistered("/swagger-ui/index.html");
    }

    @Test
    void productionKeepsBusinessApiAndSecurityChainActive() throws Exception {
        assertNotNull(securityFilterChain);

        mockMvc.perform(get("/api/company-registration-requests/validate")
                        .param("companyName", "Production Smoke")
                        .param("adminEmail", "production-smoke@example.test"))
                .andExpect(status().isOk());
    }

    private void assertDocumentationResourceIsNotRegistered(String path) throws Exception {
        ResultActions result = mockMvc.perform(get(path))
                .andExpect(status().isInternalServerError())
                .andExpect(handler().handlerType(ResourceHttpRequestHandler.class));

        assertInstanceOf(NoResourceFoundException.class, result.andReturn().getResolvedException());
    }
}
