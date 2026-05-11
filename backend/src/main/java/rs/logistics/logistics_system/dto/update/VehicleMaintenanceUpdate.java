package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.VehicleMaintenanceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class VehicleMaintenanceUpdate {

    @NotNull
    private VehicleMaintenanceType type;

    @NotNull
    private LocalDateTime scheduledAt;

    @PositiveOrZero
    private Integer odometer;

    @PositiveOrZero
    private BigDecimal cost;

    @Size(max = 1000)
    private String notes;
}
