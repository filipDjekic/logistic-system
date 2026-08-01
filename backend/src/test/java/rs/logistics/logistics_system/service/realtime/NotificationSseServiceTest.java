package rs.logistics.logistics_system.service.realtime;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.function.Consumer;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import rs.logistics.logistics_system.repository.NotificationRepository;

class NotificationSseServiceTest {

    private static final long USER_ID = 42L;

    @Test
    void opensStreamAndSendsConnectedEvent() throws Exception {
        NotificationRepository repository = org.mockito.Mockito.mock(NotificationRepository.class);
        SseEmitter emitter = org.mockito.Mockito.mock(SseEmitter.class);
        NotificationSseService service = spy(new NotificationSseService(repository));
        when(repository.countByUserIdAndStatus(any(), any())).thenReturn(3L);
        doReturn(emitter).when(service).createEmitter();

        assertSame(emitter, service.subscribe(USER_ID));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter).onCompletion(any());
        verify(emitter).onTimeout(any());
        verify(emitter).onError(any());
    }

    @Test
    void repositoryFailureOccursBeforeEmitterIsCreatedOrRegistered() {
        NotificationRepository repository = org.mockito.Mockito.mock(NotificationRepository.class);
        NotificationSseService service = spy(new NotificationSseService(repository));
        when(repository.countByUserIdAndStatus(any(), any()))
                .thenThrow(new IllegalStateException("database unavailable"));

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> service.subscribe(USER_ID)
        );

        org.junit.jupiter.api.Assertions.assertEquals("database unavailable", error.getMessage());
        verify(service, never()).createEmitter();
    }

    @Test
    void sendFailureRemovesAndClosesEmitterAndPreventsFurtherSends() throws Exception {
        NotificationRepository repository = org.mockito.Mockito.mock(NotificationRepository.class);
        SseEmitter emitter = org.mockito.Mockito.mock(SseEmitter.class);
        NotificationSseService service = spy(new NotificationSseService(repository));
        when(repository.countByUserIdAndStatus(any(), any())).thenReturn(1L);
        doReturn(emitter).when(service).createEmitter();
        doThrow(new IOException("client disconnected"))
                .when(emitter).send(any(SseEmitter.SseEventBuilder.class));

        service.subscribe(USER_ID);
        service.sendHeartbeats();

        verify(emitter, times(1)).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter, times(1)).complete();
    }

    @Test
    void timeoutClosesEmitterExactlyOnceAndPreventsFurtherSends() throws Exception {
        NotificationRepository repository = org.mockito.Mockito.mock(NotificationRepository.class);
        SseEmitter emitter = org.mockito.Mockito.mock(SseEmitter.class);
        NotificationSseService service = spy(new NotificationSseService(repository));
        AtomicReference<Runnable> timeoutCallback = new AtomicReference<>();
        when(repository.countByUserIdAndStatus(any(), any())).thenReturn(0L);
        doReturn(emitter).when(service).createEmitter();
        org.mockito.Mockito.doAnswer(invocation -> {
            timeoutCallback.set(invocation.getArgument(0));
            return null;
        }).when(emitter).onTimeout(any());

        service.subscribe(USER_ID);
        timeoutCallback.get().run();
        timeoutCallback.get().run();
        service.sendHeartbeats();

        verify(emitter, times(1)).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter, times(1)).complete();
    }

    @Test
    void completionCallbackRemovesEmitterAndIsIdempotent() throws Exception {
        NotificationRepository repository = org.mockito.Mockito.mock(NotificationRepository.class);
        SseEmitter emitter = org.mockito.Mockito.mock(SseEmitter.class);
        NotificationSseService service = spy(new NotificationSseService(repository));
        AtomicReference<Runnable> callback = new AtomicReference<>();
        when(repository.countByUserIdAndStatus(any(), any())).thenReturn(0L);
        doReturn(emitter).when(service).createEmitter();
        org.mockito.Mockito.doAnswer(invocation -> {
            callback.set(invocation.getArgument(0));
            return null;
        }).when(emitter).onCompletion(any());

        service.subscribe(USER_ID);
        callback.get().run();
        callback.get().run();
        service.sendHeartbeats();

        verify(emitter, times(1)).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter, times(1)).complete();
    }

    @Test
    void errorCallbackRemovesEmitterAndPreventsFurtherSends() throws Exception {
        NotificationRepository repository = org.mockito.Mockito.mock(NotificationRepository.class);
        SseEmitter emitter = org.mockito.Mockito.mock(SseEmitter.class);
        NotificationSseService service = spy(new NotificationSseService(repository));
        AtomicReference<Consumer<Throwable>> callback = new AtomicReference<>();
        when(repository.countByUserIdAndStatus(any(), any())).thenReturn(0L);
        doReturn(emitter).when(service).createEmitter();
        org.mockito.Mockito.doAnswer(invocation -> {
            callback.set(invocation.getArgument(0));
            return null;
        }).when(emitter).onError(any());

        service.subscribe(USER_ID);
        callback.get().accept(new IOException("client disconnected"));
        service.sendHeartbeats();

        verify(emitter, times(1)).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter, times(1)).complete();
    }

    @Test
    void oneBrokenEmitterDoesNotInterruptOtherConnections() throws Exception {
        NotificationRepository repository = org.mockito.Mockito.mock(NotificationRepository.class);
        SseEmitter broken = org.mockito.Mockito.mock(SseEmitter.class);
        SseEmitter healthy = org.mockito.Mockito.mock(SseEmitter.class);
        NotificationSseService service = spy(new NotificationSseService(repository));
        when(repository.countByUserIdAndStatus(any(), any())).thenReturn(0L);
        doReturn(broken, healthy).when(service).createEmitter();
        org.mockito.Mockito.doNothing()
                .doThrow(new IOException("client disconnected"))
                .when(broken).send(any(SseEmitter.SseEventBuilder.class));

        service.subscribe(USER_ID);
        service.subscribe(USER_ID);
        service.sendHeartbeats();
        service.sendHeartbeats();

        verify(broken, times(2)).send(any(SseEmitter.SseEventBuilder.class));
        verify(broken, times(1)).complete();
        verify(healthy, times(3)).send(any(SseEmitter.SseEventBuilder.class));
    }
}
