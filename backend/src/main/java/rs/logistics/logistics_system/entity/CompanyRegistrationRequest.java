package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "COMPANY_REGISTRATION_REQUESTS",
        indexes = {
                @Index(name = "idx_company_registration_requests_status", columnList = "status"),
                @Index(name = "idx_company_registration_requests_country_id", columnList = "country_id"),
                @Index(name = "idx_company_registration_requests_admin_email", columnList = "admin_email"),
                @Index(name = "idx_company_registration_requests_submitted_at", columnList = "submitted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class CompanyRegistrationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "company_name", length = 120, nullable = false)
    private String companyName;

    @Column(name = "registration_number", length = 40)
    private String registrationNumber;

    @Column(name = "tax_number", length = 40)
    private String taxNumber;

    @Column(name = "company_email", length = 255)
    private String companyEmail;

    @Column(name = "company_phone_number", length = 30)
    private String companyPhoneNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timezone_id", nullable = false)
    private Timezone timezone;

    @Column(name = "address", length = 200)
    private String address;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "admin_first_name", length = 60, nullable = false)
    private String adminFirstName;

    @Column(name = "admin_last_name", length = 60, nullable = false)
    private String adminLastName;

    @Column(name = "admin_address", length = 200, nullable = false)
    private String adminAddress;

    @Column(name = "admin_email", length = 255, nullable = false)
    private String adminEmail;

    @Column(name = "admin_phone_number", length = 30, nullable = false)
    private String adminPhoneNumber;

    @Column(name = "admin_jmbg", length = 13, nullable = false)
    private String adminJmbg;

    @Column(name = "admin_password", length = 255, nullable = false)
    private String adminPassword;

    @Column(name = "admin_employment_date", nullable = false)
    private LocalDate adminEmploymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private CompanyRegistrationRequestStatus status = CompanyRegistrationRequestStatus.PENDING;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_company_id")
    private Company createdCompany;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void normalize() {
        companyName = trim(companyName);
        registrationNumber = trim(registrationNumber);
        taxNumber = trim(taxNumber);
        companyEmail = lower(companyEmail);
        companyPhoneNumber = trim(companyPhoneNumber);
        address = trim(address);
        postalCode = trim(postalCode);
        adminFirstName = trim(adminFirstName);
        adminLastName = trim(adminLastName);
        adminAddress = trim(adminAddress);
        adminEmail = lower(adminEmail);
        adminPhoneNumber = trim(adminPhoneNumber);
        adminJmbg = trim(adminJmbg);
        rejectionReason = trim(rejectionReason);
        notes = trim(notes);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String lower(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }
}
