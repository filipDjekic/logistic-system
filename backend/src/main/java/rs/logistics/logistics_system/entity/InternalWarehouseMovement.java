package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import rs.logistics.logistics_system.enums.InternalWarehouseMovementStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "INTERNAL_WAREHOUSE_MOVEMENTS",
        indexes = {
                @Index(name = "idx_internal_movements_warehouse_id", columnList = "warehouse_id"),
                @Index(name = "idx_internal_movements_product_id", columnList = "product_id"),
                @Index(name = "idx_internal_movements_source_bin_id", columnList = "source_bin_id"),
                @Index(name = "idx_internal_movements_destination_bin_id", columnList = "destination_bin_id"),
                @Index(name = "idx_internal_movements_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class InternalWarehouseMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_bin_id", nullable = false)
    private BinLocation sourceBin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destination_bin_id", nullable = false)
    private BinLocation destinationBin;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private InternalWarehouseMovementStatus status = InternalWarehouseMovementStatus.COMPLETED;

    @Column(name = "note", length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
