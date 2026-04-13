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

    @Size(max = 255)
    private String notes;

    public ShiftUpdate(Long id, LocalDateTime startTime, LocalDateTime endTime, ShiftStatus status, String notes) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
    }
}
