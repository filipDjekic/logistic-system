package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "EMPLOYEE_WAREHOUSE_ASSIGNMENTS",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_employee_warehouse_assignment", columnNames = {"employee_id", "warehouse_id"})
        },
        indexes = {
                @Index(name = "idx_employee_warehouse_assignments_employee", columnList = "employee_id"),
                @Index(name = "idx_employee_warehouse_assignments_warehouse", columnList = "warehouse_id"),
                @Index(name = "idx_employee_warehouse_assignments_company_active", columnList = "company_id, active"),
                @Index(name = "idx_employee_warehouse_assignments_access", columnList = "access_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class EmployeeWarehouseAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false, length = 30)
    private EmployeeWarehouseAccessType accessType = EmployeeWarehouseAccessType.WORKER;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "notes", length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (notes != null) {
            notes = notes.trim();
        }
        if (active == null) {
            active = true;
        }
        if (accessType == null) {
            accessType = EmployeeWarehouseAccessType.WORKER;
        }
    }
}
