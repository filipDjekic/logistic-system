package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.InventoryCountLine;

import java.util.List;
import java.util.Optional;

public interface InventoryCountLineRepository extends JpaRepository<InventoryCountLine, Long> {
    interface InventoryCountLineRow {
        Long getId();
        Long getVersion();
        Long getProductId();
        String getProductName();
        String getProductSku();
        Long getBinLocationId();
        String getBinLocationCode();
        String getBinLocationName();
        Long getWarehouseZoneId();
        String getWarehouseZoneCode();
        String getWarehouseZoneName();
        java.math.BigDecimal getSystemQuantity();
        java.math.BigDecimal getCountedQuantity();
        java.math.BigDecimal getDifferenceQuantity();
        String getNote();
        Long getAdjustmentMovementId();
    }

    @EntityGraph(attributePaths = {"session", "session.warehouse", "binLocation", "binLocation.warehouse"})
    Optional<InventoryCountLine> findByIdAndSession_Id(Long id, Long sessionId);
    List<InventoryCountLine> findBySession_IdOrderByProduct_NameAsc(Long sessionId);

    @Query(value = """
            select line.id as id,
                   line.version as version,
                   product.id as productId,
                   product.name as productName,
                   product.sku as productSku,
                   bin.id as binLocationId,
                   bin.code as binLocationCode,
                   bin.name as binLocationName,
                   zone.id as warehouseZoneId,
                   zone.code as warehouseZoneCode,
                   zone.name as warehouseZoneName,
                   line.systemQuantity as systemQuantity,
                   line.countedQuantity as countedQuantity,
                   line.differenceQuantity as differenceQuantity,
                   line.note as note,
                   line.adjustmentMovementId as adjustmentMovementId
            from InventoryCountLine line
            join line.session session
            join line.product product
            left join line.binLocation bin
            left join bin.zone zone
            where session.id = :sessionId
            and (:zoneId is null or zone.id = :zoneId)
            and (:binLocationId is null or bin.id = :binLocationId)
            and (
                :status is null or :status = ''
                or (:status = 'COUNTED' and line.countedQuantity is not null)
                or (:status = 'UNCOUNTED' and line.countedQuantity is null)
                or (:status = 'DISCREPANCY' and line.countedQuantity is not null and line.differenceQuantity <> 0)
                or (:status = 'MATCHED' and line.countedQuantity is not null and line.differenceQuantity = 0)
                or (:status = 'ADJUSTED' and line.adjustmentMovementId is not null)
            )
            and (
                :search is null or :search = ''
                or lower(product.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(product.sku, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(bin.code, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(bin.name, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(zone.code, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(zone.name, '')) like lower(concat('%', :search, '%'))
            )
            """, countQuery = """
            select count(line.id)
            from InventoryCountLine line
            join line.session session
            join line.product product
            left join line.binLocation bin
            left join bin.zone zone
            where session.id = :sessionId
            and (:zoneId is null or zone.id = :zoneId)
            and (:binLocationId is null or bin.id = :binLocationId)
            and (
                :status is null or :status = ''
                or (:status = 'COUNTED' and line.countedQuantity is not null)
                or (:status = 'UNCOUNTED' and line.countedQuantity is null)
                or (:status = 'DISCREPANCY' and line.countedQuantity is not null and line.differenceQuantity <> 0)
                or (:status = 'MATCHED' and line.countedQuantity is not null and line.differenceQuantity = 0)
                or (:status = 'ADJUSTED' and line.adjustmentMovementId is not null)
            )
            and (
                :search is null or :search = ''
                or lower(product.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(product.sku, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(bin.code, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(bin.name, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(zone.code, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(zone.name, '')) like lower(concat('%', :search, '%'))
            )
            """)
    Page<InventoryCountLineRow> searchBySessionId(@Param("sessionId") Long sessionId,
                                                  @Param("search") String search,
                                                  @Param("zoneId") Long zoneId,
                                                  @Param("binLocationId") Long binLocationId,
                                                  @Param("status") String status,
                                                  Pageable pageable);

    @EntityGraph(attributePaths = {"product", "binLocation", "binLocation.warehouse"})
    @Query("""
            select line
            from InventoryCountLine line
            join line.session session
            where session.id = :sessionId
            and line.countedQuantity is not null
            and line.differenceQuantity <> 0
            order by line.id asc
            """)
    List<InventoryCountLine> findAdjustmentCandidateLines(@Param("sessionId") Long sessionId);

    @Query("""
            select case when count(line) > 0 then true else false end
            from InventoryCountLine line
            where line.session.id = :sessionId
            and line.countedQuantity is null
            """)
    boolean existsUncountedBySessionId(@Param("sessionId") Long sessionId);

    @Query("""
            select case when count(line) > 0 then true else false end
            from InventoryCountLine line
            where line.session.id = :sessionId
            and line.adjustmentMovementId is not null
            """)
    boolean existsLinkedAdjustmentBySessionId(@Param("sessionId") Long sessionId);

    boolean existsByBinLocation_Id(Long binLocationId);

    @Query("""
            select count(line) > 0
            from InventoryCountLine line
            where line.binLocation.zone.id = :zoneId
            """)
    boolean existsByZoneId(@Param("zoneId") Long zoneId);

    Optional<InventoryCountLine> findBySession_IdAndProduct_Id(Long sessionId, Long productId);
    Optional<InventoryCountLine> findBySession_IdAndProduct_IdAndBinLocation_Id(Long sessionId, Long productId, Long binLocationId);
}
