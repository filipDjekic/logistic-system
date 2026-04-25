package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.entity.WarehouseInventoryId;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, WarehouseInventoryId> {

    List<WarehouseInventory> findByWarehouse_Id(Long warehouseId);

    List<WarehouseInventory> findByWarehouse_IdAndWarehouse_Company_Id(Long warehouseId, Long companyId);

    List<WarehouseInventory> findByProduct_Id(Long productId);

    List<WarehouseInventory> findByProduct_IdAndProduct_Company_Id(Long productId, Long companyId);

    Optional<WarehouseInventory> findByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);

    Optional<WarehouseInventory> findByWarehouse_IdAndProduct_IdAndWarehouse_Company_Id(Long warehouseId, Long productId, Long companyId);

    boolean existsByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);

    List<WarehouseInventory> findAllByWarehouse_Company_Id(Long companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select wi from WarehouseInventory wi where wi.warehouse.id = :warehouseId and wi.product.id = :productId")
    Optional<WarehouseInventory> findByWarehouseIdAndProductIdForUpdate(@Param("warehouseId") Long warehouseId, @Param("productId") Long productId);

    @Query("select count(wi) from WarehouseInventory wi where wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel")
    long countLowStockRows();

    @Query("select coalesce(sum(wi.quantity), 0) from WarehouseInventory wi")
    BigDecimal sumQuantity();

    @Query("select coalesce(sum(wi.quantity - wi.reservedQuantity), 0) from WarehouseInventory wi")
    BigDecimal sumAvailableQuantity();

    long countByWarehouse_Company_Id(Long companyId);

    @Query("select count(wi) from WarehouseInventory wi where wi.warehouse.company.id = :companyId and wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel")
    long countLowStockRowsByCompanyId(@Param("companyId") Long companyId);

    @Query("select coalesce(sum(wi.quantity), 0) from WarehouseInventory wi where wi.warehouse.company.id = :companyId")
    BigDecimal sumQuantityByCompanyId(@Param("companyId") Long companyId);

    @Query("select coalesce(sum(wi.quantity - wi.reservedQuantity), 0) from WarehouseInventory wi where wi.warehouse.company.id = :companyId")
    BigDecimal sumAvailableQuantityByCompanyId(@Param("companyId") Long companyId);

    @Query("""
        select wi from WarehouseInventory wi
        where (:companyId is null or wi.warehouse.company.id = :companyId)
        and (:warehouseId is null or wi.warehouse.id = :warehouseId)
        and (:productId is null or wi.product.id = :productId)
        and (
            :search is null
            or lower(wi.warehouse.name) like lower(concat('%', :search, '%'))
            or lower(wi.warehouse.city) like lower(concat('%', :search, '%'))
            or lower(wi.product.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.sku) like lower(concat('%', :search, '%'))
        )
        and (
            :status is null
            or (:status = 'LOW_STOCK' and wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel)
            or (:status = 'SUFFICIENT' and (wi.minStockLevel is null or (wi.quantity - wi.reservedQuantity) > wi.minStockLevel))
        )
    """)
    Page<WarehouseInventory> searchInventory(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("status") String status,
            Pageable pageable
    );

}
