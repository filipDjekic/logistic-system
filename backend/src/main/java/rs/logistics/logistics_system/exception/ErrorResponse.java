package rs.logistics.logistics_system.exception;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class ErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String code;
    private String message;
    private String path;
    private String traceId;
    private List<FieldErrorResponse> fieldErrors;
    private Map<String, String> fieldErrorMap;

    public ErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String code,
            String message,
            String path,
            List<FieldErrorResponse> fieldErrors
    ) {
        this(timestamp, status, error, code, message, path, null, fieldErrors, toFieldErrorMap(fieldErrors));
    }

    public ErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String code,
            String message,
            String path,
            String traceId,
            List<FieldErrorResponse> fieldErrors
    ) {
        this(timestamp, status, error, code, message, path, traceId, fieldErrors, toFieldErrorMap(fieldErrors));
    }

    public ErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String code,
            String message,
            String path,
            List<FieldErrorResponse> fieldErrors,
            Map<String, String> fieldErrorMap
    ) {
        this(timestamp, status, error, code, message, path, null, fieldErrors, fieldErrorMap);
    }

    public ErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String code,
            String message,
            String path,
            String traceId,
            List<FieldErrorResponse> fieldErrors,
            Map<String, String> fieldErrorMap
    ) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.code = code;
        this.message = message;
        this.path = path;
        this.traceId = traceId;
        this.fieldErrors = fieldErrors == null ? List.of() : fieldErrors;
        this.fieldErrorMap = fieldErrorMap == null ? Map.of() : fieldErrorMap;
    }

    private static Map<String, String> toFieldErrorMap(List<FieldErrorResponse> fieldErrors) {
        if (fieldErrors == null || fieldErrors.isEmpty()) {
            return Map.of();
        }

        Map<String, String> result = new LinkedHashMap<>();
        for (FieldErrorResponse fieldError : fieldErrors) {
            if (fieldError == null || fieldError.getField() == null || fieldError.getField().isBlank()) {
                continue;
            }

            result.putIfAbsent(fieldError.getField(), fieldError.getMessage());
        }

        return result;
    }
}
