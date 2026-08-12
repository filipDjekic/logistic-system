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
    private BigDecimal inTransitQuantity;
    private BigDecimal weight;
    private String note;

    private Long transportOrderId;
    private Long productId;
    private BigDecimal movementUnitCost;
    private BigDecimal movementTotalCost;
    private String movementCurrency;

    public TransportOrderItemResponse(Long id,
                                      BigDecimal quantity,
                                      BigDecimal reservedQuantity,
                                      BigDecimal dispatchedQuantity,
                                      BigDecimal deliveredQuantity,
                                      BigDecimal weight,
                                      String note,
                                      Long transportOrderId,
                                      Long productId,
                                      BigDecimal movementUnitCost,
                                      BigDecimal movementTotalCost,
                                      String movementCurrency) {
        this.id = id;
        this.quantity = quantity;
        this.reservedQuantity = reservedQuantity;
        this.dispatchedQuantity = dispatchedQuantity;
        this.deliveredQuantity = deliveredQuantity;
        this.inTransitQuantity = dispatchedQuantity.subtract(deliveredQuantity).max(BigDecimal.ZERO);
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
        this.movementUnitCost = movementUnitCost;
        this.movementTotalCost = movementTotalCost;
        this.movementCurrency = movementCurrency;
    }
}
