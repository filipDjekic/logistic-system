package rs.logistics.logistics_system.exception;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import jakarta.servlet.http.HttpServletRequest;

class GlobalExceptionHandlerSseTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void asyncResponseFailureIsHandledWithoutCreatingJsonResponse() {
        AsyncRequestNotUsableException exception =
                new AsyncRequestNotUsableException("Response not usable after response errors");

        assertDoesNotThrow(() -> handler.handleAsyncRequestNotUsableException(exception));
    }

    @Test
    void disconnectedClientIOExceptionDoesNotCreateJsonResponse() {
        IOException exception = new IOException("Broken pipe");

        assertNull(handler.handleGenericException(exception, mock(HttpServletRequest.class)));
    }
}
