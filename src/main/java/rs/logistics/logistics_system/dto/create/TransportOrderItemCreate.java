package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class TransportOrderItemCreate {

    private BigDecimal quantity;
    private BigDecimal weight;
    private String note;

    private Long transportOrderId;
    private Long productId;

    public TransportOrderItemCreate(BigDecimal quantity, BigDecimal weight, String note, Long transportOrderId, Long productId) {
        this.quantity = quantity;
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
    }
}
