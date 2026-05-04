package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class TransportOrderItemResponse {

    private Long id;

    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private BigDecimal dispatchedQuantity;
    private BigDecimal deliveredQuantity;
    private BigDecimal weight;
    private String note;

    private Long transportOrderId;
    private Long productId;

    public TransportOrderItemResponse(Long id,
                                      BigDecimal quantity,
                                      BigDecimal reservedQuantity,
                                      BigDecimal dispatchedQuantity,
                                      BigDecimal deliveredQuantity,
                                      BigDecimal weight,
                                      String note,
                                      Long transportOrderId,
                                      Long productId) {
        this.id = id;
        this.quantity = quantity;
        this.reservedQuantity = reservedQuantity;
        this.dispatchedQuantity = dispatchedQuantity;
        this.deliveredQuantity = deliveredQuantity;
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
    }
}
