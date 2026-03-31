package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.entity.WarehouseInventoryId;

import java.util.List;
import java.util.Optional;

public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, WarehouseInventoryId> {

    List<WarehouseInventory> findByWarehouse_Id(Long warehouseId);

    List<WarehouseInventory> findByProduct_Id(Long productId);

    Optional<WarehouseInventory> findByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);

    boolean existsByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select wi from WarehouseInventory wi where wi.warehouse.id = :warehouseId and wi.product.id = :productId")
    Optional<WarehouseInventory> findByWarehouseIdAndProductIdForUpdate(@Param("warehouseId") Long warehouseId, @Param("productId") Long productId);
}