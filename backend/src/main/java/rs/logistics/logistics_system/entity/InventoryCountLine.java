package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "INVENTORY_COUNT_LINES", uniqueConstraints = {
        @UniqueConstraint(name = "uk_inventory_count_lines_session_product_bin", columnNames = {"session_id", "product_id", "bin_location_id"})
}, indexes = {
        @Index(name = "idx_inventory_count_lines_session_id", columnList = "session_id"),
        @Index(name = "idx_inventory_count_lines_product_id", columnList = "product_id"),
        @Index(name = "idx_inventory_count_lines_bin_location_id", columnList = "bin_location_id"),
        @Index(name = "idx_inventory_count_lines_adjustment_movement_id", columnList = "adjustment_movement_id"),
        @Index(name = "idx_inventory_count_lines_session_counted", columnList = "session_id, counted_quantity"),
        @Index(name = "idx_inventory_count_lines_session_difference", columnList = "session_id, difference_quantity"),
        @Index(name = "idx_inventory_count_lines_session_bin", columnList = "session_id, bin_location_id"),
        @Index(name = "idx_inventory_count_lines_session_adjustment", columnList = "session_id, adjustment_movement_id")
})
@Getter
@Setter
@NoArgsConstructor
public class InventoryCountLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private InventoryCountSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bin_location_id")
    private BinLocation binLocation;

    @Column(name = "system_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal systemQuantity = BigDecimal.ZERO;

    @Column(name = "counted_quantity", precision = 12, scale = 2)
    private BigDecimal countedQuantity;

    @Column(name = "difference_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal differenceQuantity = BigDecimal.ZERO;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "adjustment_movement_id")
    private Long adjustmentMovementId;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    public InventoryCountLine(InventoryCountSession session, Product product, BigDecimal systemQuantity) {
        this(session, product, null, systemQuantity);
    }

    public InventoryCountLine(InventoryCountSession session, Product product, BinLocation binLocation, BigDecimal systemQuantity) {
        this.session = session;
        this.product = product;
        this.binLocation = binLocation;
        this.systemQuantity = systemQuantity != null ? systemQuantity : BigDecimal.ZERO;
        this.differenceQuantity = BigDecimal.ZERO;
    }

    public void setCountedQuantity(BigDecimal countedQuantity) {
        this.countedQuantity = countedQuantity;
        this.differenceQuantity = countedQuantity == null ? BigDecimal.ZERO : countedQuantity.subtract(systemQuantity != null ? systemQuantity : BigDecimal.ZERO);
    }
}
