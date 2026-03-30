package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.entity.WarehouseInventory;

import java.math.BigDecimal;
import java.util.List;

public interface WarehouseInventoryServiceDefinition {

    WarehouseInventoryResponse create(WarehouseInventoryCreate dto);

    WarehouseInventoryResponse update(Long warehouseId, Long productId, WarehouseInventoryUpdate dto);

    WarehouseInventoryResponse findByWarehouseAndProduct(Long warehouseId, Long productId);

    List<WarehouseInventoryResponse> findByWarehouse(Long warehouseId);

    List<WarehouseInventoryResponse> findByProduct(Long productId);

    void delete(Long warehouseId, Long productId);

    void reserveStock(Long warehouseId, Long productId, BigDecimal quantity);

    void releaseReservedStock(Long warehouseId, Long productId, BigDecimal quantity);

    void moveOutReservedStock(Long warehouseId, Long productId, BigDecimal quantity);

    void moveInStock(Long warehouseId, Long productId, BigDecimal quantity);

    void checkLowStockAndNotify(WarehouseInventory inventory);
}
