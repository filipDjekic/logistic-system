package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "WAREHOUSE_INVENTORY")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseInventory {

    @EmbeddedId
    private WarehouseInventoryId id;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("warehouseId")
    @JoinColumn(name = "warehouseId", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("productId")
    @JoinColumn(name = "productId", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

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
        this.id = new WarehouseInventoryId(warehouse.getId(), product.getId());
        this.warehouse = warehouse;
        this.product = product;
        this.quantity = quantity;
        this.minStockLevel = minStockLevel;
    }

    // methods

    public void increase(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        this.quantity = this.quantity.add(amount);
    }

    public void decrease(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        BigDecimal available = getAvailableQuantity();

        if (available.compareTo(amount) < 0) {
            throw new IllegalStateException("Not enough available stock");
        }

        this.quantity = this.quantity.subtract(amount);
    }

    public void reserve(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        BigDecimal available = getAvailableQuantity();

        if (available.compareTo(amount) < 0) {
            throw new IllegalStateException("Not enough stock to reserve");
        }

        this.reservedQuantity = this.reservedQuantity.add(amount);
    }

    public void release(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        if (this.reservedQuantity.compareTo(amount) < 0) {
            throw new IllegalStateException("Cannot release more than reserved");
        }

        this.reservedQuantity = this.reservedQuantity.subtract(amount);
    }

    public void adjustTo(BigDecimal newQuantity) {
        if (newQuantity == null || newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        if (newQuantity.compareTo(this.reservedQuantity) < 0) {
            throw new IllegalStateException("Quantity cannot be lower than reserved");
        }

        this.quantity = newQuantity;
    }

    public BigDecimal getAvailableQuantity() {
        BigDecimal reserved = this.reservedQuantity == null ? BigDecimal.ZERO : this.reservedQuantity;
        BigDecimal quantity = this.quantity == null ? BigDecimal.ZERO : this.quantity;

        return quantity.subtract(reserved);
    }
}
