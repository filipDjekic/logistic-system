package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;

import java.util.List;

public interface WarehouseInventoryServiceDefinition {

    WarehouseInventoryResponse create(WarehouseInventoryCreate dto);

    WarehouseInventoryResponse update(Long warehouseId, Long productId, WarehouseInventoryUpdate dto);

    WarehouseInventoryResponse findByWarehouseAndProduct(Long warehouseId, Long productId);

    List<WarehouseInventoryResponse> findByWarehouse(Long warehouseId);

    List<WarehouseInventoryResponse> findByProduct(Long productId);

    void delete(Long warehouseId, Long productId);
}
