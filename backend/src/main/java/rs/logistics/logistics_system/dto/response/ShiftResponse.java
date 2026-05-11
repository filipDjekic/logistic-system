package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ShiftResponse {

    private Long id;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private TemporalView startTimeView;
    private TemporalView endTimeView;
    private ShiftStatus status;
    private String notes;
    private Long timezoneId;
    private String timezoneName;
    private String timezoneDisplayName;
    private String timezone;

    private Long employeeId;
    private Long warehouseId;
    private String warehouseName;
}
