package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.VehicleStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class VehicleUpdate {

    private Long id;

    @NotBlank
    @Size(min = 1, max = 20)
    private String registrationNumber;

    @NotBlank
    @Size(min = 1, max = 20)
    private String brand;

    @NotBlank
    @Size(min = 1, max = 20)
    private String model;

    @NotBlank
    @Size(min = 1, max = 20)
    private String type;

    @NotNull
    @Positive
    private BigDecimal capacity;

    @NotBlank
    @Size(min = 1, max = 20)
    private String fuelType;

    @NotNull
    @Min(1990)
    private Integer yearOfProduction;

    @NotNull
    private VehicleStatus status;

    public VehicleUpdate(
            Long id,
            String registrationNumber,
            String brand,
            String model,
            BigDecimal capacity,
            String type,
            String fuelType,
            Integer yearOfProduction,
            VehicleStatus status) {
        this.id = id;
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.type = type;
        this.capacity = capacity;
        this.fuelType = fuelType;
        this.yearOfProduction = yearOfProduction;
        this.status = status;
    }
}
