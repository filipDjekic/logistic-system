package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.math.BigDecimal;

@Entity
@Table(name = "WAREHOUSES")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private Employee manager;

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
