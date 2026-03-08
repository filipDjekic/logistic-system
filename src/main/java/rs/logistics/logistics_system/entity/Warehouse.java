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
@Table(name = "WAREHOUSES")
@Getter
@Setter
@NoArgsConstructor
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "name", length = 40, nullable = false)
    private String name;

    @Column(name = "address", length = 30, nullable = false)
    private String address;

    @Column(name = "city", length = 30, nullable = false)
    private String city;

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

    //relations
    @ManyToOne
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @OneToMany(mappedBy = "warehouse")
    private List<WarehouseInventory> inventoryItems = new ArrayList<>();

    @OneToMany(mappedBy = "warehouse")
    private List<StockMovement> stockMovements = new ArrayList<>();

    public Warehouse(String name,
                     String address,
                     String city,
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
}
