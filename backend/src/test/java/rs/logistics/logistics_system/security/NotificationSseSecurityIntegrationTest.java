package rs.logistics.logistics_system.security;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import rs.logistics.logistics_system.service.realtime.NotificationSseService;
import rs.logistics.logistics_system.testsupport.IntegrationTestSupport;

class NotificationSseSecurityIntegrationTest extends IntegrationTestSupport {

    @MockitoBean
    private NotificationSseService notificationSseService;

    @MockitoBean
    private AuthenticatedUserProvider authenticatedUserProvider;

    @Test
    void anonymousRequestFailsAsJsonBeforeOpeningStream() throws Exception {
        mockMvc.perform(get("/api/notifications/my/stream")
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isUnauthorized())
                .andExpect(request().asyncNotStarted())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        containsString("HttpMessageNotWritableException"))));

        verifyNoInteractions(notificationSseService);
    }

    @Test
    @WithMockUser(roles = "AUDITOR")
    void forbiddenRequestFailsAsJsonBeforeOpeningStream() throws Exception {
        mockMvc.perform(get("/api/notifications/my/stream")
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isForbidden())
                .andExpect(request().asyncNotStarted())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        containsString("HttpMessageNotWritableException"))));

        verifyNoInteractions(notificationSseService);
    }

    @Test
    @WithMockUser(roles = "WORKER")
    void authorizedStreamCompletesAsyncDispatchWithoutSecondarySecurityError() throws Exception {
        SseEmitter emitter = new SseEmitter();
        when(authenticatedUserProvider.getAuthenticatedUserId()).thenReturn(7L);
        when(notificationSseService.subscribe(7L)).thenReturn(emitter);

        MvcResult initialRequest = mockMvc.perform(get("/api/notifications/my/stream")
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andExpect(request().asyncStarted())
                .andReturn();

        emitter.complete();

        mockMvc.perform(asyncDispatch(initialRequest))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        containsString("Unable to handle the Spring Security Exception"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        containsString("AuthorizationDeniedException"))));
    }
}
