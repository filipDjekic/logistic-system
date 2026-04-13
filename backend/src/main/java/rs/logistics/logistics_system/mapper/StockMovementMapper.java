package rs.logistics.logistics_system.mapper;

import java.math.BigDecimal;

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
        return new StockMovement(
                dto.getMovementType(),
                dto.getQuantity(),
                dto.getReasonCode(),
                dto.getReasonDescription(),
                dto.getReferenceType(),
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
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
    }

    public static StockMovementResponse toResponse(StockMovement stockMovement) {
        return new StockMovementResponse(
                stockMovement.getId(),
                stockMovement.getMovementType(),
                stockMovement.getQuantity(),
                stockMovement.getReasonCode(),
                stockMovement.getReasonDescription(),
                stockMovement.getReferenceType(),
                stockMovement.getReferenceId(),
                stockMovement.getReferenceNumber(),
                stockMovement.getReferenceNote(),
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
                stockMovement.getCreatedAt()
        );
    }
}