package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.EmployeePosition;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "EMPLOYEES")
@Getter
@Setter
@NoArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "first_name", length = 30, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 30, nullable = false)
    private String lastName;

    @Column(name = "jmbg", length = 13, nullable = false, unique = true)
    private String jmbg;

    @Column(name = "phone_number", length = 20, nullable = false)
    private String phoneNumber;

    @Column(name = "email", length = 30, nullable = false, unique = true)
    private String email;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

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