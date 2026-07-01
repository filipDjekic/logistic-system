package rs.logistics.logistics_system.exception;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import jakarta.persistence.LockTimeoutException;
import jakarta.persistence.OptimisticLockException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import rs.logistics.logistics_system.observability.RequestCorrelation;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", safeMessage(ex, "Resource not found"), request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(
            BadRequestException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", safeMessage(ex, "Invalid request"), request);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflictException(
            ConflictException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.CONFLICT, "CONFLICT", safeMessage(ex, "Request conflicts with existing data"), request);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(
            UnauthorizedException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", safeMessage(ex, "Authentication is required"), request);
    }

    @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
    public ResponseEntity<ErrorResponse> handleForbiddenException(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.FORBIDDEN, "FORBIDDEN", safeMessage(ex, "Access denied"), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::mapFieldError)
                .toList();

        String message = fieldErrors.isEmpty()
                ? "Validation failed"
                : "Validation failed for " + fieldErrors.size() + " field" + (fieldErrors.size() == 1 ? "" : "s");

        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request, fieldErrors);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(
            BindException ex,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::mapFieldError)
                .toList();

        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Validation failed", request, fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = ex.getConstraintViolations()
                .stream()
                .map(this::mapConstraintViolation)
                .toList();

        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Validation failed", request, fieldErrors);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        log.warn("Data integrity violation for {} {} [traceId={}]", request.getMethod(), request.getRequestURI(), traceId(request), ex);
        return build(
                HttpStatus.CONFLICT,
                "DATA_INTEGRITY_VIOLATION",
                "Request conflicts with existing data or database constraints",
                request
        );
    }

    @ExceptionHandler({
            OptimisticLockException.class,
            OptimisticLockingFailureException.class
    })
    public ResponseEntity<ErrorResponse> handleOptimisticLockException(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.CONFLICT,
                "CONCURRENT_MODIFICATION",
                "This record was changed by another operation. Reload the data and try again.",
                request
        );
    }

    @ExceptionHandler({
            CannotAcquireLockException.class,
            PessimisticLockingFailureException.class,
            LockTimeoutException.class
    })
    public ResponseEntity<ErrorResponse> handleDatabaseLockException(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.CONFLICT,
                "RESOURCE_LOCKED",
                "The requested resource is currently being changed by another operation. Try again after reloading the data.",
                request
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST_BODY",
                "Request body is invalid or contains unsupported enum/value format",
                request
        );
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = List.of(
                new FieldErrorResponse(ex.getParameterName(), "Required request parameter is missing")
        );

        return build(HttpStatus.BAD_REQUEST, "MISSING_REQUEST_PARAMETER", "Required request parameter is missing", request, fieldErrors);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestPartException(
            MissingServletRequestPartException ex,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = List.of(
                new FieldErrorResponse(ex.getRequestPartName(), "Required multipart request part is missing")
        );

        return build(HttpStatus.BAD_REQUEST, "MISSING_REQUEST_PART", "Required multipart request part is missing", request, fieldErrors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = List.of(
                new FieldErrorResponse(ex.getName(), "Invalid value format")
        );

        return build(HttpStatus.BAD_REQUEST, "INVALID_REQUEST_PARAMETER", "Request parameter has invalid value format", request, fieldErrors);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "HTTP method is not supported for this endpoint", request);
    }

    @ExceptionHandler({IllegalStateException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleIllegalStateAndArgumentException(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_OPERATION", safeMessage(ex, "Request payload is invalid"), request);
    }

    @ExceptionHandler({BadCredentialsException.class, AuthenticationException.class})
        public ResponseEntity<ErrorResponse> handleAuthenticationException(
                RuntimeException ex,
                HttpServletRequest request
        ) {
                return build(
                        HttpStatus.UNAUTHORIZED,
                        "INVALID_CREDENTIALS",
                        "Invalid email or password",
                        request
                );
        }


    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(
            MaxUploadSizeExceededException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Uploaded file exceeds maximum allowed size", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Unhandled exception for {} {} [traceId={}]", request.getMethod(), request.getRequestURI(), traceId(request), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "Unexpected internal server error", request);
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request
    ) {
        return build(status, code, message, request, List.of());
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            List<FieldErrorResponse> fieldErrors
    ) {
        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI(),
                traceId(request),
                fieldErrors == null ? new ArrayList<>() : fieldErrors
        );

        return ResponseEntity
                .status(status)
                .header(RequestCorrelation.REQUEST_ID_HEADER, traceId(request))
                .body(errorResponse);
    }

    private String traceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestCorrelation.TRACE_ID_ATTRIBUTE);
        return traceId == null ? null : traceId.toString();
    }

    private FieldErrorResponse mapFieldError(FieldError error) {
        String message = error.getDefaultMessage() == null || error.getDefaultMessage().isBlank()
                ? "Invalid value"
                : error.getDefaultMessage();

        return new FieldErrorResponse(error.getField(), message);
    }

    private FieldErrorResponse mapConstraintViolation(ConstraintViolation<?> violation) {
        return new FieldErrorResponse(
                normalizeConstraintViolationField(violation),
                violation.getMessage() == null || violation.getMessage().isBlank() ? "Invalid value" : violation.getMessage()
        );
    }

    private String normalizeConstraintViolationField(ConstraintViolation<?> violation) {
        String propertyPath = violation.getPropertyPath() == null ? "request" : violation.getPropertyPath().toString();
        if (propertyPath.isBlank()) {
            return "request";
        }

        int lastDotIndex = propertyPath.lastIndexOf('.');
        return lastDotIndex >= 0 && lastDotIndex + 1 < propertyPath.length()
                ? propertyPath.substring(lastDotIndex + 1)
                : propertyPath;
    }

    private String safeMessage(RuntimeException ex, String fallback) {
        return ex.getMessage() == null || ex.getMessage().isBlank() ? fallback : ex.getMessage();
    }
}
