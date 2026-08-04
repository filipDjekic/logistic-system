package rs.logistics.logistics_system.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import rs.logistics.logistics_system.service.definition.CityServiceDefinition;
import rs.logistics.logistics_system.service.definition.CountryServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimezoneServiceDefinition;
import rs.logistics.logistics_system.testsupport.IntegrationTestSupport;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PublicReferenceDataSecurityIntegrationTest extends IntegrationTestSupport {

    @MockitoBean
    private CountryServiceDefinition countryService;
    @MockitoBean
    private CityServiceDefinition cityService;
    @MockitoBean
    private TimezoneServiceDefinition timezoneService;

    @BeforeEach
    void stubPublicLists() {
        when(countryService.getAll()).thenReturn(List.of());
        when(cityService.getActive()).thenReturn(List.of());
        when(timezoneService.getActive()).thenReturn(List.of());
    }

    @Test
    void anonymousGetAccessIsAllowedForReferenceData() throws Exception {
        mockMvc.perform(get("/api/countries")).andExpect(status().isOk());
        mockMvc.perform(get("/api/cities")).andExpect(status().isOk());
        mockMvc.perform(get("/api/timezones/active")).andExpect(status().isOk());
    }

    @Test
    void anonymousNonGetAccessIsRejectedForReferenceData() throws Exception {
        mockMvc.perform(post("/api/countries")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/cities")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/timezones")).andExpect(status().isUnauthorized());
    }
}
