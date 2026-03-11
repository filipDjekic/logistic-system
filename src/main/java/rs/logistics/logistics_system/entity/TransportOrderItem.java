package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "TRANSPORT_ORDER_ITEMS")
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
        this.quantity = quantity;
        this.note = note;
        this.weight = weight;
    }
}
