package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;
import rs.logistics.logistics_system.enums.VehicleMaintenanceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "VEHICLE_MAINTENANCE",
        indexes = {
                @Index(name = "idx_vehicle_maintenance_vehicle_id", columnList = "vehicle_id"),
                @Index(name = "idx_vehicle_maintenance_vehicle_status", columnList = "vehicle_id,status"),
                @Index(name = "idx_vehicle_maintenance_status_scheduled", columnList = "status,scheduled_at"),
                @Index(name = "idx_vehicle_maintenance_company_status", columnList = "company_id,status")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class VehicleMaintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 40)
    private VehicleMaintenanceType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private VehicleMaintenanceStatus status = VehicleMaintenanceStatus.PLANNED;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "odometer")
    private Integer odometer;

    @Column(name = "cost", precision = 12, scale = 2)
    private BigDecimal cost;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isActiveMaintenance() {
        return status == VehicleMaintenanceStatus.PLANNED || status == VehicleMaintenanceStatus.IN_PROGRESS;
    }
}
