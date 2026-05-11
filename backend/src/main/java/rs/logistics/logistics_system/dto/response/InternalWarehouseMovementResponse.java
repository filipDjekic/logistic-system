package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.InternalWarehouseMovementStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class InternalWarehouseMovementResponse {
    private Long id;
    private Long warehouseId;
    private String warehouseName;
    private Long productId;
    private String productName;
    private String sku;
    private Long sourceBinId;
    private String sourceBinCode;
    private Long destinationBinId;
    private String destinationBinCode;
    private BigDecimal quantity;
    private InternalWarehouseMovementStatus status;
    private String note;
    private Long createdById;
    private String createdByEmail;
    private LocalDateTime createdAt;
}
