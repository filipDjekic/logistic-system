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
import rs.logistics.logistics_system.enums.StockMovementDiscrepancyReason;
import rs.logistics.logistics_system.enums.StockMovementStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(
        name = "STOCK_MOVEMENTS",
        indexes = {
                @Index(name = "idx_stock_movements_warehouse_product_created", columnList = "warehouse_id, product_id, created_at"),
                @Index(name = "idx_stock_movements_transport_order_id", columnList = "transport_order_id"),
                @Index(name = "idx_stock_movements_reference", columnList = "reference_type, reference_id"),
                @Index(name = "idx_stock_movements_transfer_group_id", columnList = "transfer_group_id"),
                @Index(name = "idx_stock_movements_product_created", columnList = "product_id, created_at"),
                @Index(name = "idx_stock_movements_warehouse_type_created", columnList = "warehouse_id, movement_type, created_at"),
                @Index(name = "idx_stock_movements_parent_movement_id", columnList = "parent_movement_id"),
                @Index(name = "idx_stock_movements_root_movement_id", columnList = "root_movement_id"),
                @Index(name = "idx_stock_movements_status_created", columnList = "status, created_at"),
                @Index(name = "idx_stock_movements_reversal_of_movement_id", columnList = "reversal_of_movement_id"),
                @Index(name = "idx_stock_movements_reversed_by_movement_id", columnList = "reversed_by_movement_id"),
                @Index(name = "idx_stock_movements_transport_discrepancy", columnList = "transport_order_id, discrepancy_quantity"),
                @Index(name = "idx_stock_movements_discrepancy_reason_created", columnList = "discrepancy_reason, created_at"),
                @Index(name = "idx_stock_movements_batch_lot_created", columnList = "batch_lot_number, created_at")
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

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StockMovementStatus status = StockMovementStatus.EXECUTED;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "expected_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedQuantity;

    @Column(name = "actual_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualQuantity;

    @Column(name = "discrepancy_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal discrepancyQuantity = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "discrepancy_reason", length = 50)
    private StockMovementDiscrepancyReason discrepancyReason;

    @Column(name = "discrepancy_note", length = 255)
    private String discrepancyNote;

    @Column(name = "batch_lot_number", length = 100)
    private String batchLotNumber;

    @Column(name = "batch_expiration_date")
    private LocalDate batchExpirationDate;

    @Column(name = "serial_numbers", length = 2000)
    private String serialNumbers;

    @Column(name = "unit_cost", precision = 19, scale = 4)
    private BigDecimal unitCost;

    @Column(name = "total_cost", precision = 19, scale = 4)
    private BigDecimal totalCost;

    @Column(name = "currency", length = 3)
    private String currency;

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

    @Column(name = "source_type", length = 50)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "reference_code", length = 120)
    private String referenceCode;

    @Column(name = "parent_movement_id")
    private Long parentMovementId;

    @Column(name = "root_movement_id")
    private Long rootMovementId;

    @Column(name = "reversal_of_movement_id")
    private Long reversalOfMovementId;

    @Column(name = "reversed_by_movement_id")
    private Long reversedByMovementId;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_bin_id")
    private BinLocation sourceBin;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_bin_id")
    private BinLocation destinationBin;

    @OneToMany(mappedBy = "stockMovement")
    private java.util.List<Task> tasks;

    public StockMovement(
            StockMovementType movementType,
            BigDecimal quantity,
            StockMovementReasonCode reasonCode,
            String reasonDescription,
            BigDecimal expectedQuantity,
            BigDecimal actualQuantity,
            BigDecimal discrepancyQuantity,
            StockMovementDiscrepancyReason discrepancyReason,
            String discrepancyNote,
            BigDecimal unitCost,
            BigDecimal totalCost,
            String currency,
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
        this.status = StockMovementStatus.EXECUTED;
        this.quantity = quantity;
        this.expectedQuantity = expectedQuantity != null ? expectedQuantity : quantity;
        this.actualQuantity = actualQuantity != null ? actualQuantity : quantity;
        this.discrepancyQuantity = discrepancyQuantity != null ? discrepancyQuantity : BigDecimal.ZERO;
        this.discrepancyReason = discrepancyReason;
        this.discrepancyNote = discrepancyNote;
        this.unitCost = unitCost;
        this.totalCost = totalCost;
        this.currency = currency;
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
