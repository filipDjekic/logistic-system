package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.VehicleStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "VEHICLES")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "registration_number", length = 20, unique = true, nullable = false)
    private String registrationNumber;

    @Column(name = "brand", length = 20, nullable = false)
    private String brand;

    @Column(name = "model", length = 20, nullable = false)
    private String model;

    @Column(name = "type", length = 20, nullable = false)
    private String type;

    @Column(name = "capacity", nullable = false, precision = 12, scale = 2)
    private BigDecimal capacity;

    @Column(name = "fuel_type", nullable = false)
    private String fuelType;

    @Column(name = "year_of_production", nullable = false)
    private Integer yearOfProduction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private VehicleStatus status;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    //relations
    @OneToMany(mappedBy = "vehicle")
    private List<TransportOrder> transportOrders = new ArrayList<>();

    public Vehicle(String registrationNumber,
                   String brand,
                   String model,
                   String type,
                   BigDecimal capacity,
                   String fuelType,
                   Integer yearOfProduction,
                   VehicleStatus status ) {
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.type = type;
        this.capacity = capacity;
        this.fuelType = fuelType;
        this.yearOfProduction = yearOfProduction;
        this.status = status;
        this.active = true;
    }
}
