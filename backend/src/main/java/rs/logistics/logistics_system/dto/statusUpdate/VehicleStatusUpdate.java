package rs.logistics.logistics_system.dto.statusUpdate;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.VehicleStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VehicleStatusUpdate {
    @NotNull
    private VehicleStatus status;

    private String reason;

    private Long expectedVersion;
}
