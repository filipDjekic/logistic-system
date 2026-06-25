package rs.logistics.logistics_system.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementType;

@Entity
@Table(
        name = "WAREHOUSE_INVENTORY",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_warehouse_inventory_warehouse_product", columnNames = {"warehouse_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_warehouse_inventory_warehouse_id", columnList = "warehouse_id"),
                @Index(name = "idx_warehouse_inventory_product_id", columnList = "product_id"),
                @Index(name = "idx_warehouse_inventory_product_warehouse", columnList = "product_id, warehouse_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class WarehouseInventory {

    @EmbeddedId
    private WarehouseInventoryId id;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("warehouseId")
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("productId")
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "average_unit_cost", nullable = false, precision = 19, scale = 4)
    private BigDecimal averageUnitCost = BigDecimal.ZERO;

    @Column(name = "total_value", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "min_stock_level", precision = 12, scale = 2)
    private BigDecimal minStockLevel;

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Version
    private Long version;

    public WarehouseInventory(Warehouse warehouse,
                              Product product,
                              BigDecimal quantity,
                              BigDecimal minStockLevel) {
        if (warehouse == null || warehouse.getId() == null) {
            throw new IllegalArgumentException("Warehouse is required");
        }
        if (product == null || product.getId() == null) {
            throw new IllegalArgumentException("Product is required");
        }

        this.id = new WarehouseInventoryId(warehouse.getId(), product.getId());
        this.warehouse = warehouse;
        this.product = product;
        this.quantity = nonNegative(quantity, "Quantity cannot be negative");
        this.reservedQuantity = BigDecimal.ZERO;
        this.averageUnitCost = BigDecimal.ZERO;
        this.totalValue = BigDecimal.ZERO;
        updateMinStockLevel(minStockLevel);
    }

    public void increase(BigDecimal amount) {
        BigDecimal requested = positive(amount);
        this.quantity = getSafeQuantity().add(requested);
    }

    public void decrease(BigDecimal amount) {
        BigDecimal requested = positive(amount);

        if (getAvailableQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Not enough available stock");
        }

        this.quantity = getSafeQuantity().subtract(requested);
    }

    public void reserve(BigDecimal amount) {
        BigDecimal requested = positive(amount);

        if (getAvailableQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Not enough stock to reserve");
        }

        this.reservedQuantity = getSafeReservedQuantity().add(requested);
    }

    public void release(BigDecimal amount) {
        BigDecimal requested = positive(amount);

        if (getSafeReservedQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Cannot release more than reserved");
        }

        this.reservedQuantity = getSafeReservedQuantity().subtract(requested);
    }

    public void adjustTo(BigDecimal newQuantity) {
        BigDecimal targetQuantity = nonNegative(newQuantity, "Quantity cannot be negative");

        if (targetQuantity.compareTo(getSafeReservedQuantity()) < 0) {
            throw new IllegalStateException("Quantity cannot be lower than reserved");
        }

        this.quantity = targetQuantity;
    }

    public void moveOutReserved(BigDecimal amount) {
        BigDecimal requested = positive(amount);

        if (getSafeReservedQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Not enough reserved stock");
        }

        if (getSafeQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Not enough stock");
        }

        this.reservedQuantity = getSafeReservedQuantity().subtract(requested);
        this.quantity = getSafeQuantity().subtract(requested);
    }

    public void updateMinStockLevel(BigDecimal minStockLevel) {
        this.minStockLevel = minStockLevel == null
                ? null
                : nonNegative(minStockLevel, "Minimum stock level cannot be negative");
    }

    public void assertDeletable() {
        if (getSafeReservedQuantity().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("Warehouse inventory cannot be deleted while it has reserved quantity");
        }

        if (getSafeQuantity().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("Warehouse inventory cannot be deleted while quantity is greater than zero");
        }
    }

    public boolean hasStockOrReservation() {
        return getSafeQuantity().compareTo(BigDecimal.ZERO) > 0
                || getSafeReservedQuantity().compareTo(BigDecimal.ZERO) > 0;
    }

    public BigDecimal getAvailableQuantity() {
        return getSafeQuantity().subtract(getSafeReservedQuantity());
    }


    public void applyWeightedAverageValuation(StockMovementType movementType,
                                              StockAdjustmentDirection adjustmentDirection,
                                              BigDecimal quantityBefore,
                                              BigDecimal quantityAfter,
                                              BigDecimal movementQuantity,
                                              BigDecimal movementUnitCost,
                                              BigDecimal movementTotalCost,
                                              String movementCurrency,
                                              boolean decreaseForAdjustmentOrReservedTransfer) {
        if (movementType == null || movementQuantity == null) {
            return;
        }

        if (movementType == StockMovementType.RESERVATION || movementType == StockMovementType.RESERVATION_RELEASE) {
            return;
        }

        BigDecimal normalizedQuantityAfter = nonNegative(quantityAfter, "Quantity cannot be negative");
        BigDecimal normalizedMovementQuantity = positive(movementQuantity);
        BigDecimal oldTotalValue = getSafeTotalValue();
        BigDecimal oldAverageUnitCost = getSafeAverageUnitCost();
        String normalizedCurrency = normalizeCurrency(movementCurrency);
        boolean movementHasCost = movementUnitCost != null || movementTotalCost != null;

        if (movementHasCost && this.currency != null && normalizedCurrency != null && !this.currency.equals(normalizedCurrency)) {
            throw new IllegalStateException("Inventory valuation currency mismatch");
        }

        if (movementHasCost && this.currency == null && normalizedCurrency != null) {
            this.currency = normalizedCurrency;
        }

        boolean increasesValue = increasesValuation(movementType, adjustmentDirection, decreaseForAdjustmentOrReservedTransfer);
        boolean decreasesValue = decreasesValuation(movementType, adjustmentDirection, decreaseForAdjustmentOrReservedTransfer);

        if (increasesValue) {
            BigDecimal incomingValue = resolveIncomingValue(normalizedMovementQuantity, movementUnitCost, movementTotalCost, oldAverageUnitCost);
            BigDecimal newTotalValue = oldTotalValue.add(incomingValue).setScale(4, RoundingMode.HALF_UP);
            this.totalValue = normalizedQuantityAfter.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : newTotalValue;
            this.averageUnitCost = normalizedQuantityAfter.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : this.totalValue.divide(normalizedQuantityAfter, 4, RoundingMode.HALF_UP);
            return;
        }

        if (decreasesValue) {
            BigDecimal outgoingValue = oldAverageUnitCost.multiply(normalizedMovementQuantity).setScale(4, RoundingMode.HALF_UP);
            BigDecimal newTotalValue = oldTotalValue.subtract(outgoingValue);
            if (newTotalValue.compareTo(BigDecimal.ZERO) < 0 || normalizedQuantityAfter.compareTo(BigDecimal.ZERO) == 0) {
                newTotalValue = BigDecimal.ZERO;
            }
            this.totalValue = newTotalValue.setScale(4, RoundingMode.HALF_UP);
            this.averageUnitCost = normalizedQuantityAfter.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : this.totalValue.divide(normalizedQuantityAfter, 4, RoundingMode.HALF_UP);
        }
    }

    private BigDecimal resolveIncomingValue(BigDecimal movementQuantity,
                                            BigDecimal movementUnitCost,
                                            BigDecimal movementTotalCost,
                                            BigDecimal fallbackAverageUnitCost) {
        if (movementTotalCost != null) {
            return movementTotalCost.setScale(4, RoundingMode.HALF_UP);
        }
        if (movementUnitCost != null) {
            return movementUnitCost.multiply(movementQuantity).setScale(4, RoundingMode.HALF_UP);
        }
        return fallbackAverageUnitCost.multiply(movementQuantity).setScale(4, RoundingMode.HALF_UP);
    }

    private boolean increasesValuation(StockMovementType movementType,
                                       StockAdjustmentDirection adjustmentDirection,
                                       boolean decreaseForAdjustmentOrReservedTransfer) {
        return switch (movementType) {
            case INBOUND, TRANSFER_IN, RETURN_IN -> true;
            case ADJUSTMENT -> adjustmentDirection == StockAdjustmentDirection.INCREASE && !decreaseForAdjustmentOrReservedTransfer;
            default -> false;
        };
    }

    private boolean decreasesValuation(StockMovementType movementType,
                                       StockAdjustmentDirection adjustmentDirection,
                                       boolean decreaseForAdjustmentOrReservedTransfer) {
        return switch (movementType) {
            case OUTBOUND, TRANSFER_OUT, WRITE_OFF, RETURN_OUT -> true;
            case ADJUSTMENT -> adjustmentDirection == StockAdjustmentDirection.DECREASE || decreaseForAdjustmentOrReservedTransfer;
            default -> false;
        };
    }

    private String normalizeCurrency(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    public boolean hasMinStockLevel() {
        return this.minStockLevel != null;
    }

    public BigDecimal getSafeQuantity() {
        return this.quantity == null ? BigDecimal.ZERO : this.quantity;
    }

    public BigDecimal getSafeReservedQuantity() {
        return this.reservedQuantity == null ? BigDecimal.ZERO : this.reservedQuantity;
    }

    public BigDecimal getSafeAverageUnitCost() {
        return this.averageUnitCost == null ? BigDecimal.ZERO : this.averageUnitCost;
    }

    public BigDecimal getSafeTotalValue() {
        return this.totalValue == null ? BigDecimal.ZERO : this.totalValue;
    }

    public boolean isLowStock() {
        return hasMinStockLevel() && getAvailableQuantity().compareTo(this.minStockLevel) <= 0;
    }

    private BigDecimal positive(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        return amount;
    }

    private BigDecimal nonNegative(BigDecimal value, String message) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }
}
