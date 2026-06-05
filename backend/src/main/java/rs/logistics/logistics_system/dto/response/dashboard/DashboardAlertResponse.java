package rs.logistics.logistics_system.dto.response.dashboard;

public record DashboardAlertResponse(
        String severity,
        String key,
        String title,
        String message,
        long count
) {
}
