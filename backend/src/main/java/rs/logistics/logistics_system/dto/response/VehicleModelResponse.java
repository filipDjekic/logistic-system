package rs.logistics.logistics_system.dto.response;

public record VehicleModelResponse(
        Long id,
        Long brandId,
        String brandName,
        String name
) {
}