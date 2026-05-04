package rs.logistics.logistics_system.dto.response;

public record CityResponse(
        Long id,
        String name,
        String postalCode,
        Long countryId,
        String countryCode,
        String countryName,
        Boolean active
) {
}
