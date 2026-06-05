package rs.logistics.logistics_system.dto.create;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ShiftCreate {

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;


    @Size(max = 255)
    private String notes;

    @NotNull
    @Positive
    private Long timezoneId;

    @NotNull
    @Positive
    private Long employeeId;

    @Positive
    private Long warehouseId;

    public ShiftCreate(LocalDateTime startTime,
                       LocalDateTime endTime,
                       String notes,
                       Long employeeId) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
        this.employeeId = employeeId;
    }
}
