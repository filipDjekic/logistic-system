package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ShiftUpdate {

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;


    @Size(max = 255)
    private String notes;

    @NotNull
    @Positive
    private Long timezoneId;

    @Positive
    private Long warehouseId;

}
