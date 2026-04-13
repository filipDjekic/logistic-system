package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.VehicleStatus;

@Getter
@Setter
@NoArgsConstructor
public class VehicleResponse {

    private Long id;
    private String registrationNumber;
    private String brand;
    private String model;
    private String type;
    private BigDecimal capacity;
    private String fuelType;
    private Integer yearOfProduction;
    private VehicleStatus status;
    private Boolean active;
    private Long companyId;
    private String companyName;

    public VehicleResponse(
            Long id,
            String registrationNumber,
            String brand,
            String model,
            BigDecimal capacity,
            String type,
            String fuelType,
            Integer yearOfProduction,
            VehicleStatus status,
            Boolean active,
            Long companyId,
            String companyName
    ) {
        this.id = id;
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.type = type;
        this.capacity = capacity;
        this.fuelType = fuelType;
        this.yearOfProduction = yearOfProduction;
        this.status = status;
        this.active = active;
        this.companyId = companyId;
        this.companyName = companyName;
    }
}