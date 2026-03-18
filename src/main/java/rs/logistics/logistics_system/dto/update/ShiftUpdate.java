package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ShiftUpdate {

    private Long id;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    @NotNull
    private ShiftStatus status;

    @NotNull
    @Size(min = 1, max = 255)
    private String notes;

    @NotNull
    private Long employeeId;

    public ShiftUpdate(Long id, LocalDateTime startTime, LocalDateTime endTime, ShiftStatus status, String notes, Long employeeId) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
        this.employeeId = employeeId;
    }
}
