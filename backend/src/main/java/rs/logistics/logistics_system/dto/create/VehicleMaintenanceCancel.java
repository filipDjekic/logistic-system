package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VehicleMaintenanceCancel {
    @Size(max = 500)
    private String cancelReason;
}
