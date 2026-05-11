package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;
import rs.logistics.logistics_system.enums.VehicleMaintenanceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class VehicleMaintenanceResponse {
    private Long id;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private Long companyId;
    private String companyName;
    private VehicleMaintenanceType type;
    private VehicleMaintenanceStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private Integer odometer;
    private BigDecimal cost;
    private String notes;
    private String cancelReason;
    private boolean activeMaintenance;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
