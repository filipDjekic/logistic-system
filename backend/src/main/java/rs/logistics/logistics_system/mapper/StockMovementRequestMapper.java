package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.StockMovementRequestResponse;
import rs.logistics.logistics_system.entity.StockMovementRequest;

public class StockMovementRequestMapper {
    private StockMovementRequestMapper() {}

    public static StockMovementRequestResponse toResponse(StockMovementRequest request) {
        StockMovementRequestResponse response = new StockMovementRequestResponse();
        response.setId(request.getId());
        response.setMovementType(request.getMovementType());
        response.setStatus(request.getStatus());
        response.setQuantity(request.getQuantity());
        response.setAdjustmentDirection(request.getAdjustmentDirection());
        response.setReasonDescription(request.getReasonDescription());
        response.setReviewNote(request.getReviewNote());
        response.setWarehouseId(request.getWarehouse() != null ? request.getWarehouse().getId() : null);
        response.setWarehouseName(request.getWarehouse() != null ? request.getWarehouse().getName() : null);
        response.setDestinationWarehouseId(request.getDestinationWarehouse() != null ? request.getDestinationWarehouse().getId() : null);
        response.setDestinationWarehouseName(request.getDestinationWarehouse() != null ? request.getDestinationWarehouse().getName() : null);
        response.setProductId(request.getProduct() != null ? request.getProduct().getId() : null);
        response.setProductName(request.getProduct() != null ? request.getProduct().getName() : null);
        response.setBinLocationId(request.getBinLocation() != null ? request.getBinLocation().getId() : null);
        response.setDestinationBinLocationId(request.getDestinationBinLocation() != null ? request.getDestinationBinLocation().getId() : null);
        response.setRequestedById(request.getRequestedBy() != null ? request.getRequestedBy().getId() : null);
        response.setReviewedById(request.getReviewedBy() != null ? request.getReviewedBy().getId() : null);
        response.setCreatedMovementId(request.getCreatedMovement() != null ? request.getCreatedMovement().getId() : null);
        response.setCreatedAt(request.getCreatedAt());
        response.setUpdatedAt(request.getUpdatedAt());
        response.setReviewedAt(request.getReviewedAt());
        return response;
    }
}
