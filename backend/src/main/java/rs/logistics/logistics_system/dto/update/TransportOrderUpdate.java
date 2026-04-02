package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.PriorityLevel;

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

    private LocalDateTime actualArrivalTime;

    @NotNull
    private PriorityLevel priority;

    @Size(min = 1, max = 255)
    private String notes;

    @NotNull
    @Positive
    private Long sourceWarehouseId;

    @NotNull
    @Positive
    private Long destinationWarehouseId;

    @NotNull
    @Positive
    private Long vehicleId;

    @NotNull
    @Positive
    private Long assignedEmployeeId;

    public TransportOrderUpdate(Long id,
                                String orderNumber,
                                String description,
                                LocalDateTime orderDate,
                                LocalDateTime departureTime,
                                LocalDateTime plannedArrivalTime,
                                LocalDateTime actualArrivalTime,
                                PriorityLevel priority,
                                String notes,
                                Long sourceWarehouseId,
                                Long destinationWarehouseId,
                                Long vehicleId,
                                Long assignedEmployeeId) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.description = description;
        this.orderDate = orderDate;
        this.departureTime = departureTime;
        this.plannedArrivalTime = plannedArrivalTime;
        this.actualArrivalTime = actualArrivalTime;
        this.priority = priority;
        this.notes = notes;
        this.sourceWarehouseId = sourceWarehouseId;
        this.destinationWarehouseId = destinationWarehouseId;
        this.vehicleId = vehicleId;
        this.assignedEmployeeId = assignedEmployeeId;
    }
}