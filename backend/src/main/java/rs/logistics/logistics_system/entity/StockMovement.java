package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "STOCK_MOVEMENTS",
        indexes = {
                @Index(name = "idx_stock_movements_warehouse_product_created", columnList = "warehouse_id, product_id, created_at"),
                @Index(name = "idx_stock_movements_transport_order_id", columnList = "transport_order_id"),
                @Index(name = "idx_stock_movements_reference", columnList = "reference_type, reference_id"),
                @Index(name = "idx_stock_movements_transfer_group_id", columnList = "transfer_group_id"),
                @Index(name = "idx_stock_movements_product_created", columnList = "product_id, created_at"),
                @Index(name = "idx_stock_movements_warehouse_type_created", columnList = "warehouse_id, movement_type, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private StockMovementType movementType;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_code", nullable = false, length = 50)
    private StockMovementReasonCode reasonCode;

    @Column(name = "reason_description", length = 255)
    private String reasonDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", nullable = false, length = 50)
    private StockMovementReferenceType referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "reference_note", length = 255)
    private String referenceNote;

    @Column(name = "transfer_group_id", length = 100)
    private String transferGroupId;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_direction", length = 20)
    private StockAdjustmentDirection adjustmentDirection;

    @Column(name = "quantity_before", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityBefore;

    @Column(name = "quantity_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityAfter;

    @Column(name = "reserved_before", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedBefore;

    @Column(name = "reserved_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedAfter;

    @Column(name = "available_before", nullable = false, precision = 12, scale = 2)
    private BigDecimal availableBefore;

    @Column(name = "available_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal availableAfter;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transport_order_id")
    private TransportOrder transportOrder;

    @OneToMany(mappedBy = "stockMovement")
    private java.util.List<Task> tasks;

    public StockMovement(
            StockMovementType movementType,
            BigDecimal quantity,
            StockMovementReasonCode reasonCode,
            String reasonDescription,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String referenceNumber,
            String referenceNote,
            String transferGroupId,
            StockAdjustmentDirection adjustmentDirection,
            BigDecimal quantityBefore,
            BigDecimal quantityAfter,
            BigDecimal reservedBefore,
            BigDecimal reservedAfter,
            BigDecimal availableBefore,
            BigDecimal availableAfter,
            Warehouse warehouse,
            Product product,
            User createdBy,
            TransportOrder transportOrder
    ) {
        this.movementType = movementType;
        this.quantity = quantity;
        this.reasonCode = reasonCode;
        this.reasonDescription = reasonDescription;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.referenceNumber = referenceNumber;
        this.referenceNote = referenceNote;
        this.transferGroupId = transferGroupId;
        this.adjustmentDirection = adjustmentDirection;
        this.quantityBefore = quantityBefore;
        this.quantityAfter = quantityAfter;
        this.reservedBefore = reservedBefore;
        this.reservedAfter = reservedAfter;
        this.availableBefore = availableBefore;
        this.availableAfter = availableAfter;
        this.warehouse = warehouse;
        this.product = product;
        this.createdBy = createdBy;
        this.transportOrder = transportOrder;
    }
}
