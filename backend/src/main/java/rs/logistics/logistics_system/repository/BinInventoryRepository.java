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
import rs.logistics.logistics_system.entity.BinInventory;
import rs.logistics.logistics_system.entity.BinInventoryId;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BinInventoryRepository extends JpaRepository<BinInventory, BinInventoryId> {

    interface InventoryCountSnapshotRow {
        Long getProductId();
        Long getBinLocationId();
        java.math.BigDecimal getQuantity();
    }

    @Query("""
            select p.id as productId,
                   b.id as binLocationId,
                   bi.quantity as quantity
            from BinInventory bi
            join bi.binLocation b
            join b.warehouse w
            join bi.product p
            where w.id = :warehouseId
            order by b.code asc, p.name asc
            """)
    List<InventoryCountSnapshotRow> findInventoryCountSnapshotRowsByWarehouseId(@Param("warehouseId") Long warehouseId);
    Optional<BinInventory> findByBinLocation_IdAndProduct_Id(Long binLocationId, Long productId);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @Query("""
            select bi
            from BinInventory bi
            join fetch bi.binLocation binLocation
            join fetch bi.product product
            where exists (
                select 1
                from InventoryCountLine line
                where line.session.id = :sessionId
                and line.countedQuantity is not null
                and line.differenceQuantity <> 0
                and line.binLocation = binLocation
                and line.product = product
            )
            """)
    List<BinInventory> findAdjustmentStockRowsForUpdate(@Param("sessionId") Long sessionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @Query("""
            select bi
            from BinInventory bi
            join fetch bi.binLocation binLocation
            join fetch binLocation.warehouse warehouse
            join fetch bi.product product
            where binLocation.id = :binLocationId
            and product.id = :productId
            """)
    Optional<BinInventory> findForUpdate(@Param("binLocationId") Long binLocationId, @Param("productId") Long productId);


    @EntityGraph(attributePaths = {"binLocation", "binLocation.warehouse", "binLocation.zone", "product"})
    @Query("""
            select bi
            from BinInventory bi
            join bi.binLocation b
            join b.warehouse w
            join bi.product p
            where w.id = :warehouseId
            order by b.code asc, p.name asc
            """)
    List<BinInventory> findSnapshotRowsByWarehouseId(@Param("warehouseId") Long warehouseId);

    @Query("""
            select coalesce(sum(bi.quantity), 0)
            from BinInventory bi
            where bi.binLocation.warehouse.id = :warehouseId
            and bi.product.id = :productId
            """)
    BigDecimal sumQuantityByWarehouseAndProduct(@Param("warehouseId") Long warehouseId, @Param("productId") Long productId);

    @Query("""
            select coalesce(sum(bi.quantity), 0)
            from BinInventory bi
            where bi.binLocation.warehouse.id = :warehouseId
            and bi.product.id = :productId
            and bi.binLocation.id <> :excludedBinLocationId
            """)
    BigDecimal sumQuantityByWarehouseAndProductExcludingBin(@Param("warehouseId") Long warehouseId,
                                                            @Param("productId") Long productId,
                                                            @Param("excludedBinLocationId") Long excludedBinLocationId);

    @Query("""
            select coalesce(sum(bi.quantity), 0)
            from BinInventory bi
            where bi.binLocation.warehouse.id = :warehouseId
            and bi.product.id = :productId
            and bi.binLocation.id <> :firstBinLocationId
            and bi.binLocation.id <> :secondBinLocationId
            """)
    BigDecimal sumQuantityByWarehouseAndProductExcludingBins(@Param("warehouseId") Long warehouseId,
                                                             @Param("productId") Long productId,
                                                             @Param("firstBinLocationId") Long firstBinLocationId,
                                                             @Param("secondBinLocationId") Long secondBinLocationId);

    @EntityGraph(attributePaths = {"binLocation", "binLocation.warehouse", "binLocation.zone", "product"})
    @Query("""
            select bi
            from BinInventory bi
            join bi.binLocation b
            join b.warehouse w
            join b.zone z
            join bi.product p
            where (:companyId is null or w.company.id = :companyId)
            and (:warehouseId is null or w.id = :warehouseId)
            and (:zoneId is null or z.id = :zoneId)
            and (:binLocationId is null or b.id = :binLocationId)
            and (:productId is null or p.id = :productId)
            and (:quantityMin is null or bi.quantity >= :quantityMin)
            and (:quantityMax is null or bi.quantity <= :quantityMax)
            and (:reserved is null or exists (
                select 1 from WarehouseInventory wi
                where wi.warehouse = w and wi.product = p and ((:reserved = true and wi.reservedQuantity > 0) or (:reserved = false and wi.reservedQuantity = 0))
            ))
            and (:available is null or exists (
                select 1 from WarehouseInventory wi
                where wi.warehouse = w and wi.product = p and ((:available = true and (wi.quantity - wi.reservedQuantity) > 0) or (:available = false and (wi.quantity - wi.reservedQuantity) <= 0))
            ))
            and (
                :search is null
                or lower(b.code) like lower(concat('%', :search, '%'))
                or lower(z.code) like lower(concat('%', :search, '%'))
                or lower(p.name) like lower(concat('%', :search, '%'))
                or lower(p.sku) like lower(concat('%', :search, '%'))
            )
            """)
    Page<BinInventory> search(@Param("companyId") Long companyId,
                              @Param("warehouseId") Long warehouseId,
                              @Param("zoneId") Long zoneId,
                              @Param("binLocationId") Long binLocationId,
                              @Param("productId") Long productId,
                              @Param("quantityMin") BigDecimal quantityMin,
                              @Param("quantityMax") BigDecimal quantityMax,
                              @Param("reserved") Boolean reserved,
                              @Param("available") Boolean available,
                              @Param("search") String search,
                              Pageable pageable);


    @EntityGraph(attributePaths = {"binLocation", "binLocation.warehouse", "binLocation.zone", "product"})
    @Query("""
            select bi
            from BinInventory bi
            join bi.binLocation b
            join b.warehouse w
            join b.zone z
            join bi.product p
            where w.company.id = :companyId
            and w.id in :warehouseIds
            and (:warehouseId is null or w.id = :warehouseId)
            and (:zoneId is null or z.id = :zoneId)
            and (:binLocationId is null or b.id = :binLocationId)
            and (:productId is null or p.id = :productId)
            and (:quantityMin is null or bi.quantity >= :quantityMin)
            and (:quantityMax is null or bi.quantity <= :quantityMax)
            and (:reserved is null or exists (
                select 1 from WarehouseInventory wi
                where wi.warehouse = w and wi.product = p and ((:reserved = true and wi.reservedQuantity > 0) or (:reserved = false and wi.reservedQuantity = 0))
            ))
            and (:available is null or exists (
                select 1 from WarehouseInventory wi
                where wi.warehouse = w and wi.product = p and ((:available = true and (wi.quantity - wi.reservedQuantity) > 0) or (:available = false and (wi.quantity - wi.reservedQuantity) <= 0))
            ))
            and (
                :search is null
                or lower(b.code) like lower(concat('%', :search, '%'))
                or lower(z.code) like lower(concat('%', :search, '%'))
                or lower(p.name) like lower(concat('%', :search, '%'))
                or lower(p.sku) like lower(concat('%', :search, '%'))
            )
            """)
    Page<BinInventory> searchAssigned(@Param("companyId") Long companyId,
                                      @Param("warehouseIds") java.util.Collection<Long> warehouseIds,
                                      @Param("warehouseId") Long warehouseId,
                                      @Param("zoneId") Long zoneId,
                                      @Param("binLocationId") Long binLocationId,
                                      @Param("productId") Long productId,
                                      @Param("quantityMin") BigDecimal quantityMin,
                                      @Param("quantityMax") BigDecimal quantityMax,
                                      @Param("reserved") Boolean reserved,
                                      @Param("available") Boolean available,
                                      @Param("search") String search,
                                      Pageable pageable);
}
