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
@Table(name = "COMPANIES")
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
    }
}