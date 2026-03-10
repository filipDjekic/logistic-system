package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.update.StockMovementUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;

public class StockMovementMapper {

    public static StockMovement toEntity(StockMovementCreate dto, Warehouse warehouse, Product product, User user) {
        StockMovement stockMovement = new StockMovement(
                dto.getMovementType(),
                dto.getQuantity(),
                dto.getReferenceNote(),
                warehouse,
                product,
                user
        );
        return stockMovement;
    }

    public static void updateEntity(StockMovement stockMovement, StockMovementUpdate dto, Warehouse warehouse, Product product, User user) {
        stockMovement.setMovementType(dto.getMovementType());
        stockMovement.setQuantity(dto.getQuantity());
        stockMovement.setReferenceNote(dto.getReferenceNote());
        stockMovement.setWarehouse(warehouse);
        stockMovement.setProduct(product);
        stockMovement.setCreatedBy(user);
    }

    public static StockMovementUpdate toResponse(StockMovement stockMovement) {
        StockMovementUpdate stockMovementUpdate = new StockMovementUpdate(
                stockMovement.getId(),
                stockMovement.getMovementType(),
                stockMovement.getQuantity(),
                stockMovement.getReferenceNote(),
                stockMovement.getWarehouse().getId(),
                stockMovement.getProduct().getId(),
                stockMovement.getCreatedBy().getId()
        );
        return stockMovementUpdate;
    }
}
