package rs.logistics.logistics_system.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCountLineResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private BigDecimal systemQuantity;
    private BigDecimal countedQuantity;
    private BigDecimal differenceQuantity;
    private String note;
    private Long adjustmentMovementId;
}
