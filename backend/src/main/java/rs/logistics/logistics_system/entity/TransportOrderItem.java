package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(
        name = "TRANSPORT_ORDER_ITEMS",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_transport_order_items_order_product", columnNames = {"transport_order_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_transport_order_items_transport_order_id", columnList = "transport_order_id"),
                @Index(name = "idx_transport_order_items_product_id", columnList = "product_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class TransportOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "dispatched_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal dispatchedQuantity = BigDecimal.ZERO;

    @Column(name = "delivered_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveredQuantity = BigDecimal.ZERO;

    @Column(name = "weight", nullable = false, precision = 12, scale = 2)
    private BigDecimal weight;

    @Column(name = "note", length = 255)
    private String note;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transport_order_id", nullable = false)
    private TransportOrder transportOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    public TransportOrderItem(BigDecimal quantity,
                              BigDecimal weight,
                              String note,
                              TransportOrder transportOrder,
                              Product product) {
        this.transportOrder = transportOrder;
        this.product = product;
        this.quantity = positive(quantity, "Quantity must be greater than 0");
        this.note = note;
        this.weight = positive(weight, "Weight must be greater than 0");
        this.reservedQuantity = BigDecimal.ZERO;
        this.dispatchedQuantity = BigDecimal.ZERO;
        this.deliveredQuantity = BigDecimal.ZERO;
    }

    public void markReserved(BigDecimal amount) {
        this.reservedQuantity = positive(amount, "Reserved quantity must be greater than 0");
        this.dispatchedQuantity = BigDecimal.ZERO;
        this.deliveredQuantity = BigDecimal.ZERO;
    }

    public void releaseReservation() {
        this.reservedQuantity = BigDecimal.ZERO;
    }

    public void markDispatched(BigDecimal amount) {
        BigDecimal requested = positive(amount, "Dispatched quantity must be greater than 0");

        if (getSafeReservedQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Cannot dispatch more than reserved by this transport item");
        }

        this.reservedQuantity = getSafeReservedQuantity().subtract(requested);
        this.dispatchedQuantity = getSafeDispatchedQuantity().add(requested);
    }

    public void markDelivered(BigDecimal amount) {
        BigDecimal requested = positive(amount, "Delivered quantity must be greater than 0");

        if (getPendingDeliveryQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Cannot deliver more than dispatched by this transport item");
        }

        this.deliveredQuantity = getSafeDeliveredQuantity().add(requested);
    }

    public void markReturnedAfterFailure(BigDecimal amount) {
        BigDecimal requested = positive(amount, "Returned quantity must be greater than 0");

        if (getPendingDeliveryQuantity().compareTo(requested) < 0) {
            throw new IllegalStateException("Cannot return more than pending dispatched quantity");
        }

        this.dispatchedQuantity = getSafeDispatchedQuantity().subtract(requested);
    }

    public BigDecimal getSafeQuantity() {
        return quantity == null ? BigDecimal.ZERO : quantity;
    }

    public BigDecimal getSafeReservedQuantity() {
        return reservedQuantity == null ? BigDecimal.ZERO : reservedQuantity;
    }

    public BigDecimal getSafeDispatchedQuantity() {
        return dispatchedQuantity == null ? BigDecimal.ZERO : dispatchedQuantity;
    }

    public BigDecimal getSafeDeliveredQuantity() {
        return deliveredQuantity == null ? BigDecimal.ZERO : deliveredQuantity;
    }

    public BigDecimal getPendingDeliveryQuantity() {
        return getSafeDispatchedQuantity().subtract(getSafeDeliveredQuantity());
    }

    public boolean isFullyReservedForRequestedQuantity() {
        return getSafeReservedQuantity().compareTo(getSafeQuantity()) == 0;
    }

    public boolean isFullyDispatched() {
        return getSafeDispatchedQuantity().compareTo(getSafeQuantity()) == 0
                && getSafeReservedQuantity().compareTo(BigDecimal.ZERO) == 0;
    }

    public boolean isFullyDelivered() {
        return getSafeDeliveredQuantity().compareTo(getSafeQuantity()) == 0;
    }

    private BigDecimal positive(BigDecimal amount, String message) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(message);
        }

        return amount;
    }
}
