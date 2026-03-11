package rs.logistics.logistics_system.dto.update;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TransportOrderUpdate {
    private Long id;

    private String orderNumber;
    private String description;
    private LocalDateTime orderDate;
    private LocalDateTime departureTime;
    private LocalDateTime plannedArrivalTime;
    private LocalDateTime actualArrivalTime;
    private TransportOrderStatus status;
    private PriorityLevel priority;
    private BigDecimal totalWeight;
    private String notes;

    private Long sourceWarehouseId;
    private Long destinationWarehouseId;
    private Long vehicleId;
    private Long assignedEmployeeId;
    private Long createdById;

    public TransportOrderUpdate(Long id,String orderNumber,
                                  String description,
                                  LocalDateTime orderDate,
                                  LocalDateTime departureTime,
                                  LocalDateTime plannedArrivalTime,
                                  LocalDateTime actualArrivalTime,
                                  TransportOrderStatus status,
                                  PriorityLevel priority,
                                  BigDecimal totalWeight,
                                  String notes,
                                  Long sourceWarehouseId,
                                  Long destinationWarehouseId,
                                  Long vehicleId,
                                  Long assignedEmployeeId,
                                  Long createdById) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.description = description;
        this.orderDate = orderDate;
        this.departureTime = departureTime;
        this.plannedArrivalTime = plannedArrivalTime;
        this.actualArrivalTime = actualArrivalTime;
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
