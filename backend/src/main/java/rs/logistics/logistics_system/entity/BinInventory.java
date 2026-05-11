package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "BIN_INVENTORY",
        indexes = {
                @Index(name = "idx_bin_inventory_bin_location", columnList = "bin_location_id"),
                @Index(name = "idx_bin_inventory_product", columnList = "product_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BinInventory {

    @EmbeddedId
    private BinInventoryId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("binLocationId")
    @JoinColumn(name = "bin_location_id", nullable = false)
    private BinLocation binLocation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("productId")
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity = BigDecimal.ZERO;

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Version
    private Long version;

    public BinInventory(BinLocation binLocation, Product product, BigDecimal quantity) {
        this.binLocation = binLocation;
        this.product = product;
        this.id = new BinInventoryId(binLocation.getId(), product.getId());
        this.quantity = nonNegative(quantity);
    }

    public void increase(BigDecimal amount) {
        this.quantity = getSafeQuantity().add(positive(amount));
    }

    public void decrease(BigDecimal amount) {
        BigDecimal requested = positive(amount);
        if (getSafeQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Not enough product quantity in bin location");
        }
        this.quantity = getSafeQuantity().subtract(requested);
    }

    public BigDecimal getSafeQuantity() {
        return quantity == null ? BigDecimal.ZERO : quantity;
    }

    private BigDecimal positive(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        return value;
    }

    private BigDecimal nonNegative(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        return value;
    }
}
