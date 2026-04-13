package rs.logistics.logistics_system.dto.create;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.VehicleStatus;

@Getter
@Setter
@NoArgsConstructor
public class VehicleCreate {

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

    @Positive
    private Long companyId;

    public VehicleCreate(String registrationNumber,
                         String brand,
                         String model,
                         String type,
                         BigDecimal capacity,
                         String fuelType,
                         Integer yearOfProduction,
                         VehicleStatus status,
                         Long companyId) {
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.type = type;
        this.capacity = capacity;
        this.fuelType = fuelType;
        this.yearOfProduction = yearOfProduction;
        this.status = status;
        this.companyId = companyId;
    }
}