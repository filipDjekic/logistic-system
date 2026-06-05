package rs.logistics.logistics_system.dto.update;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.FuelType;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.VehicleType;

@Getter
@Setter
@NoArgsConstructor
public class VehicleUpdate {

    @Size(max = 20, message = "Registration number must be at most 20 characters")
    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotNull(message = "Vehicle model is required")
    @Positive(message = "Selected vehicle model is not valid")
    private Long vehicleModelId;

    @NotNull(message = "Type is required")
    private VehicleType type;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be greater than 0")
    private BigDecimal capacity;

    @NotNull(message = "Max weight is required")
    @Positive(message = "Max weight must be greater than 0")
    private BigDecimal maxWeight;

    @Positive(message = "Max volume must be greater than 0")
    private BigDecimal maxVolume;

    @Positive(message = "Max items must be greater than 0")
    private Integer maxItems;

    @NotNull(message = "Fuel type is required")
    private FuelType fuelType;

    @NotNull(message = "Year of production is required")
    @Min(value = 1990, message = "Year of production must be 1990 or later")
    private Integer yearOfProduction;

    @NotNull(message = "Status is required")
    private VehicleStatus status;
}