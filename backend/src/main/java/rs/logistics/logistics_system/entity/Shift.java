package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "SHIFTS",
        indexes = {
                @Index(name = "idx_shifts_employee_id", columnList = "employee_id"),
                @Index(name = "idx_shifts_employee_start_time", columnList = "employee_id, start_time"),
                @Index(name = "idx_shifts_employee_time", columnList = "employee_id, start_time, end_time"),
                @Index(name = "idx_shifts_status", columnList = "status"),
                @Index(name = "idx_shifts_status_time", columnList = "status, start_time, end_time"),
                @Index(name = "idx_shifts_warehouse_status_time", columnList = "warehouse_id, status, start_time, end_time")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timezone_id", nullable = false)
    private Timezone timezone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ShiftStatus status;

    @Column(name = "notes", length = 255)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    //relations
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    public Shift(LocalDateTime startTime,
                 LocalDateTime endTime,
                 ShiftStatus status,
                 String notes,
                 Employee employee) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
        this.employee = employee;
    }
}
