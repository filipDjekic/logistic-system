package rs.logistics.logistics_system.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeePosition;

@Entity
@Table(
        name = "EMPLOYEES",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_employees_company_jmbg", columnNames = {"company_id", "jmbg"}),
                @UniqueConstraint(name = "uk_employees_company_email", columnNames = {"company_id", "email"}),
                @UniqueConstraint(name = "uk_employees_user_id", columnNames = "user_id")
        },
        indexes = {
                @Index(name = "idx_employees_company_id", columnList = "company_id"),
                @Index(name = "idx_employees_company_position", columnList = "company_id, position"),
                @Index(name = "idx_employees_company_active", columnList = "company_id, active"),
                @Index(name = "idx_employees_company_active_employment", columnList = "company_id, active, employment_date"),
                @Index(name = "idx_employees_primary_warehouse_id", columnList = "primary_warehouse_id"),
                @Index(name = "idx_employees_user_id", columnList = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "first_name", length = 60, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 60, nullable = false)
    private String lastName;

    @Column(name = "jmbg", length = 13, nullable = false)
    private String jmbg;

    @Column(name = "phone_code", length = 10)
    private String phoneCode;

    @Column(name = "phone_number", length = 30, nullable = false)
    private String phoneNumber;

    @Column(name = "email", length = 255, nullable = false)
    private String email;

    @Column(name = "address", length = 200)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timezone_id")
    private Timezone timezone;

    @Enumerated(EnumType.STRING)
    @Column(name = "position", length = 50, nullable = false)
    private EmployeePosition position;

    @Column(name = "employment_date", nullable = false)
    private LocalDate employmentDate;

    @Column(name = "salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal salary;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private Country country;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_warehouse_id")
    private Warehouse primaryWarehouse;

    @OneToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "user_id", unique = true, nullable = true)
    private User user;

    @OneToMany(mappedBy = "employee")
    private List<Shift> shifts = new ArrayList<>();

    @OneToMany(mappedBy = "assignedEmployee")
    private List<TransportOrder> transportOrders = new ArrayList<>();

    @OneToMany(mappedBy = "assignedEmployee")
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "manager")
    private List<Warehouse> managedWarehouses = new ArrayList<>();

    @OneToMany(mappedBy = "employee")
    private List<EmployeeWarehouseAssignment> warehouseAssignments = new ArrayList<>();

    public Employee(String firstName,
                    String lastName,
                    String jmbg,
                    String phoneNumber,
                    String email,
                    EmployeePosition position,
                    LocalDate employmentDate,
                    BigDecimal salary,
                    User user) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.jmbg = jmbg;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.position = position;
        this.employmentDate = employmentDate;
        this.salary = salary;
        this.active = true;
        this.user = user;
    }

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (firstName != null) {
            firstName = firstName.trim();
        }
        if (lastName != null) {
            lastName = lastName.trim();
        }
        if (jmbg != null) {
            jmbg = jmbg.trim();
        }
        if (phoneNumber != null) {
            phoneNumber = phoneNumber.trim();
        }
        if (email != null) {
            email = email.trim().toLowerCase();
        }
    }
}
