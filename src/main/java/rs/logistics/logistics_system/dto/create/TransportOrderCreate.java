package rs.logistics.logistics_system.dto.create;

import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransportOrderCreate {

    private String orderNumber;
    private String description;
    private LocalDateTime orderDate;
    private LocalDateTime departureTime;
    private LocalDateTime plannedArrivalTime;
    private TransportOrderStatus status;
    private PriorityLevel priority;
    private BigDecimal totalWeight;
    private String notes;

    private Long sourceWarehouseId;
    private Long destinationWarehouseId;
    private Long vehicleId;
    private Long assignedEmployeeId;
    private Long createdById;

    public TransportOrderCreate() {}

    public TransportOrderCreate(String orderNumber,
                                  String description,
                                  LocalDateTime orderDate,
                                  LocalDateTime departureTime,
                                  LocalDateTime plannedArrivalTime,
                                  TransportOrderStatus status,
                                  PriorityLevel priority,
                                  BigDecimal totalWeight,
                                  String notes,
                                  Long sourceWarehouseId,
                                  Long destinationWarehouseId,
                                  Long vehicleId,
                                  Long assignedEmployeeId,
                                  Long createdById) {
        this.orderNumber = orderNumber;
        this.description = description;
        this.orderDate = orderDate;
        this.departureTime = departureTime;
        this.plannedArrivalTime = plannedArrivalTime;
        this.status = status;
        this.priority = priority;
        this.totalWeight = totalWeight;
        this.notes = notes;
        this.sourceWarehouseId = sourceWarehouseId;
        this.destinationWarehouseId = destinationWarehouseId;
        this.vehicleId = vehicleId;
        this.assignedEmployeeId = assignedEmployeeId;
        this.createdById = createdById;
    }

    public String getOrderNumber() {
        return orderNumber;
    }
    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public LocalDateTime getOrderDate() {
        return orderDate;
    }
    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }
    public LocalDateTime getDepartureTime() {
        return departureTime;
    }
    public void setDepartureTime(LocalDateTime departureTime) {
        this.departureTime = departureTime;
    }
    public LocalDateTime getPlannedArrivalTime() {
        return plannedArrivalTime;
    }
    public void setPlannedArrivalTime(LocalDateTime plannedArrivalTime) {
        this.plannedArrivalTime = plannedArrivalTime;
    }
    public TransportOrderStatus getStatus() {
        return status;
    }
    public void setStatus(TransportOrderStatus status) {
        this.status = status;
    }
    public PriorityLevel getPriority() {
        return priority;
    }
    public void setPriority(PriorityLevel priority) {
        this.priority = priority;
    }
    public BigDecimal getTotalWeight() {
        return totalWeight;
    }
    public void setTotalWeight(BigDecimal totalWeight) {
        this.totalWeight = totalWeight;
    }
    public String getNotes() {
        return notes;
    }
    public void setNotes(String notes) {
        this.notes = notes;
    }
    public Long getSourceWarehouseId() {
        return sourceWarehouseId;
    }
    public void setSourceWarehouseId(Long sourceWarehouseId) {
        this.sourceWarehouseId = sourceWarehouseId;
    }
    public Long getDestinationWarehouseId() {
        return destinationWarehouseId;
    }
    public void setDestinationWarehouseId(Long destinationWarehouseId) {
        this.destinationWarehouseId = destinationWarehouseId;
    }
    public Long getVehicleId() {
        return vehicleId;
    }
    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }
    public Long getAssignedEmployeeId() {
        return assignedEmployeeId;
    }
    public void setAssignedEmployeeId(Long assignedEmployeeId) {
        this.assignedEmployeeId = assignedEmployeeId;
    }
    public Long getCreatedById() {
        return createdById;
    }
    public void setCreatedById(Long createdById) {
        this.createdById = createdById;
    }
}
