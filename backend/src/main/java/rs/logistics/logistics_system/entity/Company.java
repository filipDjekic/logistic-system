package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "COMPANIES",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_companies_name", columnNames = "name")
        },
        indexes = {
                @Index(name = "idx_companies_active", columnList = "active"),
                @Index(name = "idx_companies_country_id", columnList = "country_id"),
                @Index(name = "idx_companies_timezone_id", columnList = "timezone_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "name", length = 120, nullable = false, unique = true)
    private String name;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @Column(name = "phone_code", length = 10)
    private String phoneCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timezone_id", nullable = false)
    private Timezone timezone;

    @Column(name = "address", length = 200)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "tax_number", length = 40)
    private String taxNumber;

    @Column(name = "registration_number", length = 40)
    private String registrationNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "company")
    private List<User> users = new ArrayList<>();

    @OneToMany(mappedBy = "company")
    private List<Employee> employees = new ArrayList<>();

    @OneToMany(mappedBy = "company")
    private List<Vehicle> vehicles = new ArrayList<>();

    @OneToMany(mappedBy = "company")
    private List<Warehouse> warehouses = new ArrayList<>();

    @OneToMany(mappedBy = "company")
    private List<Product> products = new ArrayList<>();

    public Company(String name) {
        this.name = name;
        this.active = true;
    }

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (name != null) {
            name = name.trim();
        }
        if (address != null) {
            address = address.trim();
        }
        if (phoneNumber != null) {
            phoneNumber = phoneNumber.trim();
        }
        if (email != null) {
            email = email.trim().toLowerCase();
        }
        if (taxNumber != null) {
            taxNumber = taxNumber.trim();
        }
        if (registrationNumber != null) {
            registrationNumber = registrationNumber.trim();
        }
    }
}