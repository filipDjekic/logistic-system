package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementResponse {

    private Long id;
    private StockMovementType movementType;
    private BigDecimal quantity;

    private StockMovementReasonCode reasonCode;
    private String reasonDescription;

    private StockMovementReferenceType referenceType;
    private Long referenceId;
    private String referenceNumber;
    private String referenceNote;

    private BigDecimal quantityBefore;
    private BigDecimal quantityAfter;
    private BigDecimal reservedBefore;
    private BigDecimal reservedAfter;
    private BigDecimal availableBefore;
    private BigDecimal availableAfter;

    private Long warehouseId;
    private Long productId;
    private Long createdById;
    private Long transportOrderId;

    private LocalDateTime createdAt;

    public StockMovementResponse(
            Long id,
            StockMovementType movementType,
            BigDecimal quantity,
            StockMovementReasonCode reasonCode,
            String reasonDescription,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String referenceNumber,
            String referenceNote,
            BigDecimal quantityBefore,
            BigDecimal quantityAfter,
            BigDecimal reservedBefore,
            BigDecimal reservedAfter,
            BigDecimal availableBefore,
            BigDecimal availableAfter,
            Long warehouseId,
            Long productId,
            Long createdById,
            Long transportOrderId,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.movementType = movementType;
        this.quantity = quantity;
        this.reasonCode = reasonCode;
        this.reasonDescription = reasonDescription;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.referenceNumber = referenceNumber;
        this.referenceNote = referenceNote;
        this.quantityBefore = quantityBefore;
        this.quantityAfter = quantityAfter;
        this.reservedBefore = reservedBefore;
        this.reservedAfter = reservedAfter;
        this.availableBefore = availableBefore;
        this.availableAfter = availableAfter;
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.createdById = createdById;
        this.transportOrderId = transportOrderId;
        this.createdAt = createdAt;
    }
}