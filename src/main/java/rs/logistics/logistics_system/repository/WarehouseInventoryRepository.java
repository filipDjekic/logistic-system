package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.entity.WarehouseInventoryId;

import java.util.List;
import java.util.Optional;

public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, WarehouseInventoryId> {


    List<WarehouseInventory> findByWarehouse_Id(Long warehouseId);

    List<WarehouseInventory> findByProduct_Id(Long productId);

    Optional<WarehouseInventory> findByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);

    boolean existsByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);
}
