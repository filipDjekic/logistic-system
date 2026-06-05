package rs.logistics.logistics_system.dto.response;

public record LifecycleAlertResponse(
        String severity,
        String key,
        String title,
        String message,
        long count,
        String entityType,
        String route
) {
}
