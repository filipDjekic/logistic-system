package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.entity.WarehouseInventoryId;

import java.util.List;
import java.util.Optional;

public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, WarehouseInventoryId> {
    List<WarehouseInventory> findByWarehouseId(Long warehouseId);

    List<WarehouseInventory> findByProductId(Long productId);

    Optional<WarehouseInventory> findByWarehouseAndProductId(Long warehouseId, Long productId);

    boolean existsByWarehouseIdAndProductId(Long warehouseId, Long productId);
}
