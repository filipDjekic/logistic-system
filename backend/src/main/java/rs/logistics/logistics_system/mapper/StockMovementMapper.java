package rs.logistics.logistics_system.mapper;

import java.math.BigDecimal;
import java.util.List;

import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;

public class StockMovementMapper {

    public static StockMovement toEntity(
            StockMovementCreate dto,
            Warehouse warehouse,
            Product product,
            User user,
            TransportOrder transportOrder,
            BigDecimal quantityBefore,
            BigDecimal quantityAfter,
            BigDecimal reservedBefore,
            BigDecimal reservedAfter,
            BigDecimal availableBefore,
            BigDecimal availableAfter
    ) {
        BigDecimal actualQuantity = dto.getActualQuantity() != null ? dto.getActualQuantity() : dto.getQuantity();
        BigDecimal expectedQuantity = dto.getExpectedQuantity() != null ? dto.getExpectedQuantity() : actualQuantity;
        BigDecimal discrepancyQuantity = actualQuantity.subtract(expectedQuantity);
        BigDecimal unitCost = normalizeCost(dto.getUnitCost());
        BigDecimal totalCost = normalizeTotalCost(dto.getTotalCost(), unitCost, actualQuantity);

        StockMovement movement = new StockMovement(
                dto.getMovementType(),
                actualQuantity,
                dto.getReasonCode(),
                dto.getReasonDescription(),
                expectedQuantity,
                actualQuantity,
                discrepancyQuantity,
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                unitCost,
                totalCost,
                normalizeCurrency(dto.getCurrency()),
                dto.getReferenceType(),
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                quantityBefore,
                quantityAfter,
                reservedBefore,
                reservedAfter,
                availableBefore,
                availableAfter,
                warehouse,
                product,
                user,
                transportOrder
        );
        movement.setBatchLotNumber(dto.getBatchLotNumber());
        movement.setBatchExpirationDate(dto.getBatchExpirationDate());
        movement.setSerialNumbers(dto.getSerialNumbers() == null || dto.getSerialNumbers().isEmpty() ? null : String.join(",", dto.getSerialNumbers()));
        return movement;
    }

    public static StockMovementResponse toResponse(StockMovement stockMovement) {
        return toResponse(stockMovement, List.of());
    }

    public static StockMovementResponse toResponse(StockMovement stockMovement, List<rs.logistics.logistics_system.enums.StockMovementStatus> allowedNextStatuses) {
        return new StockMovementResponse(
                stockMovement.getId(),
                stockMovement.getMovementType(),
                stockMovement.getStatus(),
                allowedNextStatuses,
                stockMovement.getQuantity(),
                stockMovement.getExpectedQuantity(),
                stockMovement.getActualQuantity(),
                stockMovement.getDiscrepancyQuantity(),
                stockMovement.getDiscrepancyReason(),
                stockMovement.getDiscrepancyNote(),
                stockMovement.getBatchLotNumber(),
                stockMovement.getBatchExpirationDate(),
                stockMovement.getSerialNumbers(),
                stockMovement.getUnitCost(),
                stockMovement.getTotalCost(),
                stockMovement.getCurrency(),
                stockMovement.getReasonCode(),
                stockMovement.getReasonDescription(),
                stockMovement.getReferenceType(),
                stockMovement.getReferenceId(),
                stockMovement.getReferenceNumber(),
                stockMovement.getReferenceNote(),
                stockMovement.getTransferGroupId(),
                stockMovement.getSourceType(),
                stockMovement.getSourceId(),
                stockMovement.getReferenceCode(),
                stockMovement.getParentMovementId(),
                stockMovement.getRootMovementId(),
                stockMovement.getReversalOfMovementId(),
                stockMovement.getReversedByMovementId(),
                stockMovement.getAdjustmentDirection(),
                stockMovement.getQuantityBefore(),
                stockMovement.getQuantityAfter(),
                stockMovement.getReservedBefore(),
                stockMovement.getReservedAfter(),
                stockMovement.getAvailableBefore(),
                stockMovement.getAvailableAfter(),
                stockMovement.getWarehouse().getId(),
                stockMovement.getWarehouse().getName(),
                stockMovement.getWarehouse().getCompany() != null ? stockMovement.getWarehouse().getCompany().getId() : null,
                stockMovement.getProduct().getId(),
                stockMovement.getProduct().getName(),
                stockMovement.getProduct().getCompany() != null ? stockMovement.getProduct().getCompany().getId() : null,
                stockMovement.getCreatedBy().getId(),
                stockMovement.getTransportOrder() != null ? stockMovement.getTransportOrder().getId() : null,
                stockMovement.getSourceBin() != null ? stockMovement.getSourceBin().getId() : null,
                stockMovement.getSourceBin() != null ? stockMovement.getSourceBin().getCode() : null,
                stockMovement.getSourceBin() != null && stockMovement.getSourceBin().getZone() != null ? stockMovement.getSourceBin().getZone().getId() : null,
                stockMovement.getDestinationBin() != null ? stockMovement.getDestinationBin().getId() : null,
                stockMovement.getDestinationBin() != null ? stockMovement.getDestinationBin().getCode() : null,
                stockMovement.getDestinationBin() != null && stockMovement.getDestinationBin().getZone() != null ? stockMovement.getDestinationBin().getZone().getId() : null,
                stockMovement.getCreatedAt()
        );
    }

    private static BigDecimal normalizeCost(BigDecimal value) {
        return value != null ? value : null;
    }

    private static BigDecimal normalizeTotalCost(BigDecimal totalCost, BigDecimal unitCost, BigDecimal quantity) {
        if (totalCost != null) {
            return totalCost;
        }
        if (unitCost == null || quantity == null) {
            return null;
        }
        return unitCost.multiply(quantity);
    }

    private static String normalizeCurrency(String currency) {
        return currency == null || currency.isBlank() ? null : currency.trim().toUpperCase();
    }

}
