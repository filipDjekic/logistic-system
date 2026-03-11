package rs.logistics.logistics_system.dto.update;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class TransportOrderItemUpdate {

    private Long id;

    private BigDecimal quantity;
    private BigDecimal weight;
    private String note;

    private Long transportOrderId;
    private Long productId;

    public TransportOrderItemUpdate(Long id, BigDecimal quantity, BigDecimal weight, String note, Long transportOrderId, Long productId) {
        this.id = id;
        this.quantity = quantity;
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
    }
}
