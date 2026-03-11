package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
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
}
