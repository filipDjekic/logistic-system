package rs.logistics.logistics_system.dto.response;

public record LookupOptionResponse(
        Long id,
        String label,
        String subtitle,
        String status
) {
}
