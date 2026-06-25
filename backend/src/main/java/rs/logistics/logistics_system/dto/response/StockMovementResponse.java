package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementDiscrepancyReason;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.StockMovementType;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementResponse {

    private Long id;
    private StockMovementType movementType;
    private StockMovementStatus status;
    private List<StockMovementStatus> allowedNextStatuses;
    private BigDecimal quantity;
    private BigDecimal expectedQuantity;
    private BigDecimal actualQuantity;
    private BigDecimal discrepancyQuantity;
    private StockMovementDiscrepancyReason discrepancyReason;
    private String discrepancyNote;
    private String batchLotNumber;
    private LocalDate batchExpirationDate;
    private String serialNumbers;

    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String currency;

    private StockMovementReasonCode reasonCode;
    private String reasonDescription;

    private StockMovementReferenceType referenceType;
    private Long referenceId;
    private String referenceNumber;
    private String referenceNote;
    private String transferGroupId;
    private String sourceType;
    private Long sourceId;
    private String referenceCode;
    private Long parentMovementId;
    private Long rootMovementId;
    private Long reversalOfMovementId;
    private Long reversedByMovementId;
    private StockAdjustmentDirection adjustmentDirection;

    private BigDecimal quantityBefore;
    private BigDecimal quantityAfter;
    private BigDecimal reservedBefore;
    private BigDecimal reservedAfter;
    private BigDecimal availableBefore;
    private BigDecimal availableAfter;

    private Long warehouseId;
    private String warehouseName;
    private Long warehouseCompanyId;

    private Long productId;
    private String productName;
    private Long productCompanyId;

    private Long createdById;
    private Long transportOrderId;

    private Long sourceBinId;
    private String sourceBinCode;
    private Long sourceBinZoneId;
    private Long destinationBinId;
    private String destinationBinCode;
    private Long destinationBinZoneId;

    private LocalDateTime createdAt;

    public StockMovementResponse(
            Long id,
            StockMovementType movementType,
            StockMovementStatus status,
            List<StockMovementStatus> allowedNextStatuses,
            BigDecimal quantity,
            BigDecimal expectedQuantity,
            BigDecimal actualQuantity,
            BigDecimal discrepancyQuantity,
            StockMovementDiscrepancyReason discrepancyReason,
            String discrepancyNote,
            String batchLotNumber,
            LocalDate batchExpirationDate,
            String serialNumbers,
            BigDecimal unitCost,
            BigDecimal totalCost,
            String currency,
            StockMovementReasonCode reasonCode,
            String reasonDescription,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String referenceNumber,
            String referenceNote,
            String transferGroupId,
            String sourceType,
            Long sourceId,
            String referenceCode,
            Long parentMovementId,
            Long rootMovementId,
            Long reversalOfMovementId,
            Long reversedByMovementId,
            StockAdjustmentDirection adjustmentDirection,
            BigDecimal quantityBefore,
            BigDecimal quantityAfter,
            BigDecimal reservedBefore,
            BigDecimal reservedAfter,
            BigDecimal availableBefore,
            BigDecimal availableAfter,
            Long warehouseId,
            String warehouseName,
            Long warehouseCompanyId,
            Long productId,
            String productName,
            Long productCompanyId,
            Long createdById,
            Long transportOrderId,
            Long sourceBinId,
            String sourceBinCode,
            Long sourceBinZoneId,
            Long destinationBinId,
            String destinationBinCode,
            Long destinationBinZoneId,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.movementType = movementType;
        this.status = status;
        this.allowedNextStatuses = allowedNextStatuses;
        this.quantity = quantity;
        this.expectedQuantity = expectedQuantity;
        this.actualQuantity = actualQuantity;
        this.discrepancyQuantity = discrepancyQuantity;
        this.discrepancyReason = discrepancyReason;
        this.discrepancyNote = discrepancyNote;
        this.batchLotNumber = batchLotNumber;
        this.batchExpirationDate = batchExpirationDate;
        this.serialNumbers = serialNumbers;
        this.unitCost = unitCost;
        this.totalCost = totalCost;
        this.currency = currency;
        this.reasonCode = reasonCode;
        this.reasonDescription = reasonDescription;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.referenceNumber = referenceNumber;
        this.referenceNote = referenceNote;
        this.transferGroupId = transferGroupId;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.referenceCode = referenceCode;
        this.parentMovementId = parentMovementId;
        this.rootMovementId = rootMovementId;
        this.reversalOfMovementId = reversalOfMovementId;
        this.reversedByMovementId = reversedByMovementId;
        this.adjustmentDirection = adjustmentDirection;
        this.quantityBefore = quantityBefore;
        this.quantityAfter = quantityAfter;
        this.reservedBefore = reservedBefore;
        this.reservedAfter = reservedAfter;
        this.availableBefore = availableBefore;
        this.availableAfter = availableAfter;
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
        this.warehouseCompanyId = warehouseCompanyId;
        this.productId = productId;
        this.productName = productName;
        this.productCompanyId = productCompanyId;
        this.createdById = createdById;
        this.transportOrderId = transportOrderId;
        this.sourceBinId = sourceBinId;
        this.sourceBinCode = sourceBinCode;
        this.sourceBinZoneId = sourceBinZoneId;
        this.destinationBinId = destinationBinId;
        this.destinationBinCode = destinationBinCode;
        this.destinationBinZoneId = destinationBinZoneId;
        this.createdAt = createdAt;
    }
}
