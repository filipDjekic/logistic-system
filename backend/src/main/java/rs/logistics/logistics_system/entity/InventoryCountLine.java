package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "INVENTORY_COUNT_LINES", uniqueConstraints = {
        @UniqueConstraint(name = "uk_inventory_count_lines_session_product", columnNames = {"session_id", "product_id"})
}, indexes = {
        @Index(name = "idx_inventory_count_lines_session_id", columnList = "session_id"),
        @Index(name = "idx_inventory_count_lines_product_id", columnList = "product_id"),
        @Index(name = "idx_inventory_count_lines_adjustment_movement_id", columnList = "adjustment_movement_id")
})
@Getter
@Setter
@NoArgsConstructor
public class InventoryCountLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private InventoryCountSession session;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

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

    public InventoryCountLine(InventoryCountSession session, Product product, BigDecimal systemQuantity) {
        this.session = session;
        this.product = product;
        this.systemQuantity = systemQuantity != null ? systemQuantity : BigDecimal.ZERO;
        this.differenceQuantity = BigDecimal.ZERO;
    }

    public void setCountedQuantity(BigDecimal countedQuantity) {
        this.countedQuantity = countedQuantity;
        this.differenceQuantity = countedQuantity == null ? BigDecimal.ZERO : countedQuantity.subtract(systemQuantity != null ? systemQuantity : BigDecimal.ZERO);
    }
}
