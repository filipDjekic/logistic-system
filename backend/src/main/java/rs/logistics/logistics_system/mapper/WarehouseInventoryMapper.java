package rs.logistics.logistics_system.mapper;

import java.math.BigDecimal;

import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;

public class WarehouseInventoryMapper {

    public static WarehouseInventory toEntity(WarehouseInventoryCreate dto, Warehouse warehouse, Product product) {
        return new WarehouseInventory(
                warehouse,
                product,
                dto.getQuantity(),
                dto.getMinStockLevel()
        );
    }

    public static void updateEntity(WarehouseInventoryUpdate dto, WarehouseInventory warehouseInventory) {
        warehouseInventory.updateMinStockLevel(dto.getMinStockLevel());
    }

    public static WarehouseInventoryResponse toResponse(WarehouseInventory warehouseInventory) {
        BigDecimal quantity = warehouseInventory.getSafeQuantity();
        BigDecimal reserved = warehouseInventory.getSafeReservedQuantity();
        BigDecimal available = warehouseInventory.getAvailableQuantity();

        return new WarehouseInventoryResponse(
                warehouseInventory.getWarehouse().getId(),
                warehouseInventory.getWarehouse().getName(),
                warehouseInventory.getWarehouse().getCompany() != null ? warehouseInventory.getWarehouse().getCompany().getId() : null,
                warehouseInventory.getProduct().getId(),
                warehouseInventory.getProduct().getName(),
                warehouseInventory.getProduct().getCompany() != null ? warehouseInventory.getProduct().getCompany().getId() : null,
                quantity,
                reserved,
                available,
                warehouseInventory.getMinStockLevel(),
                warehouseInventory.getSafeAverageUnitCost(),
                warehouseInventory.getSafeTotalValue(),
                warehouseInventory.getCurrency()
        );
    }
}