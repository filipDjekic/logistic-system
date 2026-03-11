package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.VehicleStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class VehicleCreate {

    private String registrationNumber;
    private String brand;
    private String model;
    private String type;
    private BigDecimal capacity;
    private String fuelType;
    private Integer yearOfProduction;
    private VehicleStatus status;

    public VehicleCreate(String registrationNumber,
                         String brand,
                         String model,
                         String type,
                         BigDecimal capacity,
                         String fuelType,
                         Integer yearOfProduction,
                         VehicleStatus status) {
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
