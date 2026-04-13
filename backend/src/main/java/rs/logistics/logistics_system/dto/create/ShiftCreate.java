package rs.logistics.logistics_system.dto.create;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ShiftStatus;

@Getter
@Setter
@NoArgsConstructor
public class ShiftCreate {

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    @NotNull
    private ShiftStatus status;

    @NotBlank
    @Size(min = 1, max = 255)
    private String notes;

    @NotNull
    @Positive
    private Long employeeId;

    public ShiftCreate(LocalDateTime startTime,
                       LocalDateTime endTime,
                       ShiftStatus status,
                       String notes,
                       Long employeeId) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
        this.employeeId = employeeId;
    }
}
