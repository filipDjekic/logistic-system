package rs.logistics.logistics_system.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.realtime.NotificationSseService;

class NotificationControllerSseTest {

    @Test
    void successfulSubscriptionSelectsEventStreamOnlyAfterServiceReturns() throws Exception {
        AuthenticatedUserProvider userProvider = mock(AuthenticatedUserProvider.class);
        NotificationSseService sseService = mock(NotificationSseService.class);
        SseEmitter emitter = new SseEmitter();
        when(userProvider.getAuthenticatedUserId()).thenReturn(7L);
        when(sseService.subscribe(7L)).thenReturn(emitter);
        NotificationController controller = new NotificationController(
                mock(NotificationServiceDefinition.class),
                userProvider,
                sseService
        );

        ResponseEntity<SseEmitter> response = controller.streamMyNotifications();

        assertEquals(MediaType.TEXT_EVENT_STREAM, response.getHeaders().getContentType());
        assertEquals(emitter, response.getBody());
        GetMapping mapping = NotificationController.class
                .getMethod("streamMyNotifications")
                .getAnnotation(GetMapping.class);
        assertEquals(0, mapping.produces().length,
                "The mapping must not preset SSE before subscription succeeds");
    }

    @Test
    void failureBeforeSubscriptionDoesNotCreateAnSseResponse() {
        AuthenticatedUserProvider userProvider = mock(AuthenticatedUserProvider.class);
        NotificationSseService sseService = mock(NotificationSseService.class);
        when(userProvider.getAuthenticatedUserId()).thenReturn(7L);
        when(sseService.subscribe(7L)).thenThrow(new IllegalStateException("database unavailable"));
        NotificationController controller = new NotificationController(
                mock(NotificationServiceDefinition.class),
                userProvider,
                sseService
        );

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                controller::streamMyNotifications
        );

        assertTrue(error.getMessage().contains("database unavailable"));
    }
}
