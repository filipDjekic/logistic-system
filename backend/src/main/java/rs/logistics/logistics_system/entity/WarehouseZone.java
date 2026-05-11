package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.WarehouseZoneType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "WAREHOUSE_ZONES",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_warehouse_zones_warehouse_code", columnNames = {"warehouse_id", "code"})
        },
        indexes = {
                @Index(name = "idx_warehouse_zones_warehouse_id", columnList = "warehouse_id"),
                @Index(name = "idx_warehouse_zones_warehouse_active", columnList = "warehouse_id, active"),
                @Index(name = "idx_warehouse_zones_type", columnList = "type")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class WarehouseZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "code", nullable = false, length = 40)
    private String code;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private WarehouseZoneType type = WarehouseZoneType.STORAGE;

    @Column(name = "capacity", precision = 12, scale = 2)
    private BigDecimal capacity;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "description", length = 500)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "zone")
    private List<BinLocation> binLocations = new ArrayList<>();

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (code != null) {
            code = code.trim().toUpperCase();
        }
        if (name != null) {
            name = name.trim();
        }
        if (description != null) {
            description = description.trim();
        }
    }
}
