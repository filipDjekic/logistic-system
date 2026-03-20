package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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

    @NotBlank
    @Size(min = 1, max = 50)
    private String orderNumber;

    @NotBlank
    @Size(min = 1, max = 500)
    private String description;

    @NotNull
    private LocalDateTime orderDate;

    @NotNull
    private LocalDateTime departureTime;

    @NotNull
    private LocalDateTime plannedArrivalTime;

    @NotNull
    private LocalDateTime actualArrivalTime;

    @NotNull
    @Size(min = 1, max = 30)
    private TransportOrderStatus status;

    @NotNull
    private PriorityLevel priority;

    @NotNull
    @Positive
    private BigDecimal totalWeight;

    @Size(min = 1, max = 255)
    private String notes;

    @NotNull
    private Long sourceWarehouseId;

    @NotNull
    private Long destinationWarehouseId;

    @NotNull
    private Long vehicleId;

    @NotNull
    private Long assignedEmployeeId;

    @NotNull
    private Long createdById;

    public TransportOrderUpdate(Long id,String orderNumber,
                                  String description,
                                  LocalDateTime orderDate,
                                  LocalDateTime departureTime,
                                  LocalDateTime plannedArrivalTime,
                                  LocalDateTime actualArrivalTime,
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
