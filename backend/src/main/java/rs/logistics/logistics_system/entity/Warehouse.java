package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "WAREHOUSES",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_warehouses_company_name", columnNames = {"company_id", "name"})
        },
        indexes = {
                @Index(name = "idx_warehouses_company_id", columnList = "company_id"),
                @Index(name = "idx_warehouses_company_status", columnList = "company_id, status"),
                @Index(name = "idx_warehouses_company_status_active", columnList = "company_id, status, active"),
                @Index(name = "idx_warehouses_manager_company", columnList = "manager_id, company_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "address", length = 200, nullable = false)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timezone_id", nullable = false)
    private Timezone timezone;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "capacity", nullable = false)
    private BigDecimal capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WarehouseStatus status;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @OneToMany(mappedBy = "warehouse")
    private List<WarehouseInventory> inventoryItems = new ArrayList<>();

    @OneToMany(mappedBy = "warehouse")
    private List<StockMovement> stockMovements = new ArrayList<>();

    public Warehouse(String name,
                     String address,
                     City city,
                     BigDecimal capacity,
                     WarehouseStatus status,
                     Employee manager) {
        this.name = name;
        this.address = address;
        this.city = city;
        this.capacity = capacity;
        this.status = status;
        this.manager = manager;
        this.active = true;
    }

    public boolean isOperational() {
        return Boolean.TRUE.equals(this.active) && this.status == WarehouseStatus.ACTIVE;
    }
}
