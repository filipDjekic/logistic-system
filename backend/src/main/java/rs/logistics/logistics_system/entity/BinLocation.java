package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "BIN_LOCATIONS",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_bin_locations_warehouse_code", columnNames = {"warehouse_id", "code"})
        },
        indexes = {
                @Index(name = "idx_bin_locations_warehouse_id", columnList = "warehouse_id"),
                @Index(name = "idx_bin_locations_zone_id", columnList = "zone_id"),
                @Index(name = "idx_bin_locations_warehouse_active", columnList = "warehouse_id, active")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BinLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "zone_id", nullable = false)
    private WarehouseZone zone;

    @Column(name = "code", nullable = false, length = 60)
    private String code;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

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

    @OneToMany(mappedBy = "binLocation")
    private List<BinInventory> inventory = new ArrayList<>();

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
