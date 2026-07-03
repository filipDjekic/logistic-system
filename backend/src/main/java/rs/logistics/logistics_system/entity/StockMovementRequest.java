package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "STOCK_MOVEMENT_REQUESTS",
        indexes = {
                @Index(name = "idx_stock_movement_requests_status", columnList = "status"),
                @Index(name = "idx_stock_movement_requests_warehouse", columnList = "warehouse_id"),
                @Index(name = "idx_stock_movement_requests_requested_by", columnList = "requested_by_user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class StockMovementRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private StockMovementType movementType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StockMovementRequestStatus status = StockMovementRequestStatus.REQUESTED;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_direction", length = 20)
    private StockAdjustmentDirection adjustmentDirection;

    @Column(name = "reason_description", length = 255)
    private String reasonDescription;

    @Column(name = "review_note", length = 255)
    private String reviewNote;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_warehouse_id")
    private Warehouse destinationWarehouse;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bin_location_id")
    private BinLocation binLocation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_bin_location_id")
    private BinLocation destinationBinLocation;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    private User requestedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewed_by_user_id")
    private User reviewedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_movement_id")
    private StockMovement createdMovement;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
