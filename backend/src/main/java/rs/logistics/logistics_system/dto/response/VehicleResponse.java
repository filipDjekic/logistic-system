package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.FuelType;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.VehicleType;

@Getter
@Setter
@NoArgsConstructor
public class VehicleResponse {

    private Long id;
    private String registrationNumber;

    private Long vehicleBrandId;
    private String brand;

    private Long vehicleModelId;
    private String model;

    private VehicleType type;
    private BigDecimal capacity;
    private BigDecimal maxWeight;
    private BigDecimal maxVolume;
    private Integer maxItems;
    private FuelType fuelType;
    private Integer yearOfProduction;
    private VehicleStatus status;
    private Boolean active;
    private Long companyId;
    private String companyName;

    public VehicleResponse(Long id,
                           String registrationNumber,
                           Long vehicleBrandId,
                           String brand,
                           Long vehicleModelId,
                           String model,
                           BigDecimal capacity,
                           BigDecimal maxWeight,
                           BigDecimal maxVolume,
                           Integer maxItems,
                           VehicleType type,
                           FuelType fuelType,
                           Integer yearOfProduction,
                           VehicleStatus status,
                           Boolean active,
                           Long companyId,
                           String companyName) {
        this.id = id;
        this.registrationNumber = registrationNumber;
        this.vehicleBrandId = vehicleBrandId;
        this.brand = brand;
        this.vehicleModelId = vehicleModelId;
        this.model = model;
        this.type = type;
        this.capacity = capacity;
        this.maxWeight = maxWeight;
        this.maxVolume = maxVolume;
        this.maxItems = maxItems;
        this.fuelType = fuelType;
        this.yearOfProduction = yearOfProduction;
        this.status = status;
        this.active = active;
        this.companyId = companyId;
        this.companyName = companyName;
    }
}