package rs.logistics.logistics_system.dto.response.data;

public record ImportRowErrorResponse(
        int line,
        String field,
        String value,
        String message
) {
}
