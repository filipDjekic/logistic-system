package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.QueryHints;
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

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "warehouse.timezone", "product", "product.company"})
    Optional<WarehouseInventory> findByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "warehouse.timezone", "product", "product.company"})
    Optional<WarehouseInventory> findByWarehouse_IdAndProduct_IdAndWarehouse_Company_Id(Long warehouseId, Long productId, Long companyId);

    boolean existsByWarehouse_IdAndProduct_Id(Long warehouseId, Long productId);

    boolean existsByWarehouse_Id(Long warehouseId);

    boolean existsByProduct_Id(Long productId);

    @Query("""
            select case when count(wi) > 0 then true else false end
            from WarehouseInventory wi
            where wi.warehouse.id = :warehouseId
            and (wi.quantity > 0 or wi.reservedQuantity > 0)
            """)
    boolean existsNonEmptyByWarehouseId(@Param("warehouseId") Long warehouseId);

    List<WarehouseInventory> findAllByWarehouse_Company_Id(Long companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @Query("""
            select wi
            from WarehouseInventory wi
            join fetch wi.warehouse warehouse
            join fetch wi.product product
            where warehouse.id = :warehouseId
            and product.id = :productId
            """)
    Optional<WarehouseInventory> findByWarehouseIdAndProductIdForUpdate(@Param("warehouseId") Long warehouseId, @Param("productId") Long productId);

    @Query("select count(wi) from WarehouseInventory wi where wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel")
    long countLowStockRows();

    @Query("""
            select wi
            from WarehouseInventory wi
            join fetch wi.warehouse warehouse
            join fetch wi.product product
            where wi.minStockLevel is not null
            and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel
            """)
    List<WarehouseInventory> findLowStockRows();



    @Query("""
            select wi
            from WarehouseInventory wi
            join fetch wi.warehouse warehouse
            join fetch wi.product product
            where (:companyId is null or warehouse.company.id = :companyId)
            and wi.minStockLevel is not null
            and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel
            order by (wi.quantity - wi.reservedQuantity) asc
            """)
    List<WarehouseInventory> findTopOperationalLowStockRows(@Param("companyId") Long companyId, Pageable pageable);

    @Query("select coalesce(sum(wi.quantity), 0) from WarehouseInventory wi")
    BigDecimal sumQuantity();

    @Query("select coalesce(sum(wi.quantity), 0) from WarehouseInventory wi where wi.warehouse.id = :warehouseId")
    BigDecimal sumQuantityByWarehouseId(@Param("warehouseId") Long warehouseId);

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
            or lower(wi.warehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.sku) like lower(concat('%', :search, '%'))
        )
        and (
            :status is null
            or (:status = 'LOW_STOCK' and wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel)
            or (:status = 'SUFFICIENT' and (wi.minStockLevel is null or (wi.quantity - wi.reservedQuantity) > wi.minStockLevel))
            or (:status = 'RESERVED' and wi.reservedQuantity > 0)
            or (:status = 'OUT_OF_STOCK' and (wi.quantity - wi.reservedQuantity) = 0)
            or (:status = 'AVAILABLE' and (wi.quantity - wi.reservedQuantity) > 0)
        )
    """)
    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "warehouse.timezone", "product", "product.company"})
    Page<WarehouseInventory> searchInventory(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("status") String status,
            Pageable pageable
    );


    @Query("""
        select count(wi) > 0
        from WarehouseInventory wi
        where wi.product.id = :productId
        and wi.warehouse.company.id = :companyId
    """)
    boolean existsProductInCompany(@Param("productId") Long productId, @Param("companyId") Long companyId);

    @Query("""
        select count(wi) from WarehouseInventory wi
        where (:companyId is null or wi.warehouse.company.id = :companyId)
        and (:warehouseId is null or wi.warehouse.id = :warehouseId)
        and (:productId is null or wi.product.id = :productId)
        and (
            :search is null
            or lower(wi.warehouse.name) like lower(concat('%', :search, '%'))
            or lower(wi.warehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.sku) like lower(concat('%', :search, '%'))
        )
        and (
            (:status = 'LOW_STOCK' and wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel)
            or (:status = 'SUFFICIENT' and (wi.minStockLevel is null or (wi.quantity - wi.reservedQuantity) > wi.minStockLevel))
            or (:status = 'RESERVED' and wi.reservedQuantity > 0)
            or (:status = 'OUT_OF_STOCK' and (wi.quantity - wi.reservedQuantity) = 0)
            or (:status = 'AVAILABLE' and (wi.quantity - wi.reservedQuantity) > 0)
        )
    """)
    long countByDerivedStatus(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("status") String status
    );


    @Query("select count(wi) from WarehouseInventory wi where wi.warehouse.id in :warehouseIds and wi.warehouse.company.id = :companyId")
    long countByWarehouseIdsAndCompanyId(@Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("companyId") Long companyId);

    @Query("select count(wi) from WarehouseInventory wi where wi.warehouse.id in :warehouseIds and wi.warehouse.company.id = :companyId and wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel")
    long countLowStockRowsByWarehouseIdsAndCompanyId(@Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("companyId") Long companyId);

    @Query("select coalesce(sum(wi.quantity), 0) from WarehouseInventory wi where wi.warehouse.id in :warehouseIds and wi.warehouse.company.id = :companyId")
    BigDecimal sumQuantityByWarehouseIdsAndCompanyId(@Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("companyId") Long companyId);

    @Query("select coalesce(sum(wi.reservedQuantity), 0) from WarehouseInventory wi where wi.warehouse.id in :warehouseIds and wi.warehouse.company.id = :companyId")
    BigDecimal sumReservedQuantityByWarehouseIdsAndCompanyId(@Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("companyId") Long companyId);

    @Query("select coalesce(sum(wi.quantity - wi.reservedQuantity), 0) from WarehouseInventory wi where wi.warehouse.id in :warehouseIds and wi.warehouse.company.id = :companyId")
    BigDecimal sumAvailableQuantityByWarehouseIdsAndCompanyId(@Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("companyId") Long companyId);

    @Query("""
            select warehouse.id,
                   warehouse.name,
                   count(wi),
                   sum(case when wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel then 1 else 0 end),
                   coalesce(sum(wi.quantity), 0),
                   coalesce(sum(wi.reservedQuantity), 0),
                   coalesce(sum(wi.quantity - wi.reservedQuantity), 0)
            from WarehouseInventory wi
            join wi.warehouse warehouse
            where warehouse.id in :warehouseIds
            and warehouse.company.id = :companyId
            group by warehouse.id, warehouse.name
            """)
    List<Object[]> aggregateInventoryByWarehouseIdsAndCompanyId(@Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("companyId") Long companyId);


    @Query("""
            select wi
            from WarehouseInventory wi
            join fetch wi.warehouse warehouse
            join fetch wi.product product
            where warehouse.id in :warehouseIds
            and warehouse.company.id = :companyId
            and wi.minStockLevel is not null
            and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel
            order by (wi.quantity - wi.reservedQuantity) asc
            """)
    List<WarehouseInventory> findTopLowStockRowsByWarehouseIdsAndCompanyId(@Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("companyId") Long companyId, org.springframework.data.domain.Pageable pageable);

    long countByWarehouse_Id(Long warehouseId);

    List<WarehouseInventory> findByWarehouse_IdInAndWarehouse_Company_Id(java.util.Collection<Long> warehouseIds, Long companyId);



    @Query("""
        select wi from WarehouseInventory wi
        where wi.warehouse.company.id = :companyId
        and wi.warehouse.id in :warehouseIds
        and (:warehouseId is null or wi.warehouse.id = :warehouseId)
        and (:productId is null or wi.product.id = :productId)
        and (
            :search is null
            or lower(wi.warehouse.name) like lower(concat('%', :search, '%'))
            or lower(wi.warehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.sku) like lower(concat('%', :search, '%'))
        )
        and (
            :status is null
            or (:status = 'LOW_STOCK' and wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel)
            or (:status = 'SUFFICIENT' and (wi.minStockLevel is null or (wi.quantity - wi.reservedQuantity) > wi.minStockLevel))
            or (:status = 'RESERVED' and wi.reservedQuantity > 0)
            or (:status = 'OUT_OF_STOCK' and (wi.quantity - wi.reservedQuantity) = 0)
            or (:status = 'AVAILABLE' and (wi.quantity - wi.reservedQuantity) > 0)
        )
    """)
    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "warehouse.timezone", "product", "product.company"})
    Page<WarehouseInventory> searchInventoryForWarehouseIds(
            @Param("companyId") Long companyId,
            @Param("warehouseIds") java.util.Collection<Long> warehouseIds,
            @Param("search") String search,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("""
        select count(wi) from WarehouseInventory wi
        where wi.warehouse.company.id = :companyId
        and wi.warehouse.id in :warehouseIds
        and (:warehouseId is null or wi.warehouse.id = :warehouseId)
        and (:productId is null or wi.product.id = :productId)
        and (
            :search is null
            or lower(wi.warehouse.name) like lower(concat('%', :search, '%'))
            or lower(wi.warehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.name) like lower(concat('%', :search, '%'))
            or lower(wi.product.sku) like lower(concat('%', :search, '%'))
        )
        and (
            (:status = 'LOW_STOCK' and wi.minStockLevel is not null and (wi.quantity - wi.reservedQuantity) <= wi.minStockLevel)
            or (:status = 'SUFFICIENT' and (wi.minStockLevel is null or (wi.quantity - wi.reservedQuantity) > wi.minStockLevel))
            or (:status = 'RESERVED' and wi.reservedQuantity > 0)
            or (:status = 'OUT_OF_STOCK' and (wi.quantity - wi.reservedQuantity) = 0)
            or (:status = 'AVAILABLE' and (wi.quantity - wi.reservedQuantity) > 0)
        )
    """)
    long countByDerivedStatusForWarehouseIds(
            @Param("companyId") Long companyId,
            @Param("warehouseIds") java.util.Collection<Long> warehouseIds,
            @Param("search") String search,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("status") String status
    );
}
