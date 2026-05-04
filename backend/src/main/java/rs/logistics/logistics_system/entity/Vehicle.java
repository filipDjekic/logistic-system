package rs.logistics.logistics_system.entity;

import java.math.BigDecimal;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.FuelType;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.VehicleType;

@Entity
@Table(
        name = "VEHICLES",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_vehicles_company_registration_number", columnNames = {"company_id", "registration_number"})
        },
        indexes = {
                @Index(name = "idx_vehicles_company_id", columnList = "company_id"),
                @Index(name = "idx_vehicles_company_status", columnList = "company_id, status"),
                @Index(name = "idx_vehicles_company_active", columnList = "company_id, active"),
                @Index(name = "idx_vehicles_company_status_active", columnList = "company_id, status, active"),
                @Index(name = "idx_vehicles_vehicle_model_id", columnList = "vehicle_model_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "registration_number", length = 20, nullable = false)
    private String registrationNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_model_id", nullable = false)
    private VehicleModel vehicleModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private VehicleType type;

    @Column(name = "capacity", nullable = false, precision = 12, scale = 2)
    private BigDecimal capacity;

    @Column(name = "max_weight", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxWeight;

    @Column(name = "max_volume", precision = 12, scale = 2)
    private BigDecimal maxVolume;

    @Column(name = "max_items")
    private Integer maxItems;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false)
    private FuelType fuelType;

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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @OneToMany(mappedBy = "vehicle")
    private List<TransportOrder> transportOrders = new ArrayList<>();

    public Vehicle(String registrationNumber,
                   VehicleModel vehicleModel,
                   VehicleType type,
                   BigDecimal capacity,
                   BigDecimal maxWeight,
                   BigDecimal maxVolume,
                   Integer maxItems,
                   FuelType fuelType,
                   Integer yearOfProduction,
                   VehicleStatus status) {
        this.registrationNumber = registrationNumber;
        this.vehicleModel = vehicleModel;
        this.type = type;
        this.capacity = capacity;
        this.maxWeight = maxWeight;
        this.maxVolume = maxVolume;
        this.maxItems = maxItems;
        this.fuelType = fuelType;
        this.yearOfProduction = yearOfProduction;
        this.status = status;
        this.active = true;
    }

    public String getBrand() {
        return vehicleModel != null && vehicleModel.getBrand() != null
                ? vehicleModel.getBrand().getName()
                : null;
    }

    public String getModel() {
        return vehicleModel != null
                ? vehicleModel.getName()
                : null;
    }

    public boolean canCarry(BigDecimal weight) {
        if (weight == null) {
            return true;
        }

        if (this.maxWeight == null) {
            return false;
        }

        return weight.compareTo(this.maxWeight) <= 0;
    }
}