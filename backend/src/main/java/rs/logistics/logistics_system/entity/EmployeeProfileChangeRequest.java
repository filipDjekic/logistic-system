package rs.logistics.logistics_system.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeeProfileChangeRequestStatus;

@Entity
@Table(
        name = "EMPLOYEE_PROFILE_CHANGE_REQUESTS",
        indexes = {
                @Index(name = "idx_emp_profile_change_requests_employee_id", columnList = "employee_id"),
                @Index(name = "idx_emp_profile_change_requests_company_status", columnList = "company_id, status"),
                @Index(name = "idx_emp_profile_change_requests_requested_by", columnList = "requested_by_user_id"),
                @Index(name = "idx_emp_profile_change_requests_reviewed_by", columnList = "reviewed_by_user_id"),
                @Index(name = "idx_emp_profile_change_requests_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class EmployeeProfileChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private EmployeeProfileChangeRequestStatus status = EmployeeProfileChangeRequestStatus.PENDING;

    @Column(name = "requested_changes_json", columnDefinition = "nvarchar(max)", nullable = false)
    private String requestedChangesJson;

    @Column(name = "reason", length = 1000)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (status == null) {
            status = EmployeeProfileChangeRequestStatus.PENDING;
        }
        if (reason != null) {
            reason = reason.trim();
        }
        if (rejectionReason != null) {
            rejectionReason = rejectionReason.trim();
        }
        if (requestedChangesJson != null) {
            requestedChangesJson = requestedChangesJson.trim();
        }
    }
}
