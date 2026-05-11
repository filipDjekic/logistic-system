package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class BinInventoryResponse {
    private Long binLocationId;
    private String binLocationCode;
    private String binLocationName;
    private Long warehouseId;
    private String warehouseName;
    private Long zoneId;
    private String zoneCode;
    private Long productId;
    private String productName;
    private String sku;
    private BigDecimal quantity;
    private LocalDateTime lastUpdated;
}
