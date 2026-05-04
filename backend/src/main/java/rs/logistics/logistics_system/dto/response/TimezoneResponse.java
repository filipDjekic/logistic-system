package rs.logistics.logistics_system.dto.response;

public record TimezoneResponse(
    Long id,
    String name,
    String displayName,
    Integer utcOffsetMinutes,
    Long countryId,
    String countryCode,
    String countryName,
    Boolean active
) {
}
