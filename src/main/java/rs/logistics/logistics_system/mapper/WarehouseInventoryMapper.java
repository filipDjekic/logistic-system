package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;

public class WarehouseInventoryMapper {

    public static WarehouseInventory toEntity(WarehouseInventoryCreate dto, Warehouse warehouse, Product product) {
        WarehouseInventory warehouseInventory = new WarehouseInventory(
                warehouse,
                product,
                dto.getQuantity(),
                dto.getReservedQuantity(),
                dto.getMinStockLevel()
        );
        return warehouseInventory;
    }

    public static void updateEntity(WarehouseInventoryUpdate dto, Warehouse warehouse, Product product, WarehouseInventory warehouseInventory) {
        warehouseInventory.setQuantity(dto.getQuantity());
        warehouseInventory.setReservedQuantity(dto.getReservedQuantity());
        warehouseInventory.setMinStockLevel(dto.getMinStockLevel());
        warehouseInventory.setProduct(product);
        warehouseInventory.setWarehouse(warehouse);
    }

    public static WarehouseInventoryResponse toResponse(WarehouseInventory warehouseInventory) {
        WarehouseInventoryResponse warehouseInventoryResponse = new WarehouseInventoryResponse(
                warehouseInventory.getQuantity(),
                warehouseInventory.getReservedQuantity(),
                warehouseInventory.getMinStockLevel(),
                warehouseInventory.getWarehouse().getId(),
                warehouseInventory.getProduct().getId()
        );
        return warehouseInventoryResponse;
    }
}
