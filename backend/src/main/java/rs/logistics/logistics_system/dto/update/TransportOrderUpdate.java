package rs.logistics.logistics_system.dto.update;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.PriorityLevel;

@Getter
@Setter
@NoArgsConstructor
public class TransportOrderUpdate {
    @NotBlank
    @Size(min = 1, max = 50)
    private String orderNumber;

    @Size(max = 500)
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

    @Size(max = 255)
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

}