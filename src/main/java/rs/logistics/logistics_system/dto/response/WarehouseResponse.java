package rs.logistics.logistics_system.dto.response;

import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.math.BigDecimal;

public class WarehouseResponse {

    private Long id;

    private String name;
    private String address;
    private String city;
    private BigDecimal capacity;
    private WarehouseStatus status;

    private Long employeeId;

    public WarehouseResponse() {}

    public WarehouseResponse(Long id, String name, String address, String city, BigDecimal capacity, WarehouseStatus status, Long employeeId) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.city = city;
        this.capacity = capacity;
        this.status = status;
        this.employeeId = employeeId;
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    public String getCity() {
        return city;
    }
    public void setCity(String city) {
        this.city = city;
    }
    public BigDecimal getCapacity() {
        return capacity;
    }
    public void setCapacity(BigDecimal capacity) {
        this.capacity = capacity;
    }
    public WarehouseStatus getStatus() {
        return status;
    }
    public void setStatus(WarehouseStatus status) {
        this.status = status;
    }
    public Long getEmployeeId() {
        return employeeId;
    }
    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }
}
