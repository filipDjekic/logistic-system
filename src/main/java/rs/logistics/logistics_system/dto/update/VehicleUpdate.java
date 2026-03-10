package rs.logistics.logistics_system.dto.update;

import rs.logistics.logistics_system.enums.VehicleStatus;

import java.math.BigDecimal;

public class VehicleUpdate {

    private Long id;

    private String registrationNumber;
    private String brand;
    private String model;
    private String type;
    private BigDecimal capacity;
    private String fuelType;
    private Integer yearOfProduction;
    private VehicleStatus status;

    public VehicleUpdate() {}

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

    public String getRegistrationNumber() {
        return registrationNumber;
    }
    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }
    public String getBrand() {
        return brand;
    }
    public void setBrand(String brand) {
        this.brand = brand;
    }
    public String getModel() {
        return model;
    }
    public void setModel(String model) {
        this.model = model;
    }
    public String getType() {
        return type;
    }
    public void setType(String type) {
        this.type = type;
    }
    public BigDecimal getCapacity() {
        return capacity;
    }
    public void setCapacity(BigDecimal capacity) {
        this.capacity = capacity;
    }
    public String getFuelType() {
        return fuelType;
    }
    public void setFuelType(String fuelType) {
        this.fuelType = fuelType;
    }
    public Integer getYearOfProduction() {
        return yearOfProduction;
    }
    public void setYearOfProduction(Integer yearOfProduction) {
        this.yearOfProduction = yearOfProduction;
    }
    public VehicleStatus getStatus() {
        return status;
    }
    public void setStatus(VehicleStatus status) {
        this.status = status;
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
}
