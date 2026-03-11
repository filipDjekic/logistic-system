package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ShiftCreate {

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ShiftStatus status;
    private String notes;

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
