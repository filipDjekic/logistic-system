package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.InventoryCountSession;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;

import java.util.List;
import java.util.Optional;

public interface InventoryCountSessionRepository extends JpaRepository<InventoryCountSession, Long> {
    interface InventoryCountSessionLineStats {
        Long getSessionId();
        Long getLineCount();
        Long getCountedLineCount();
        Long getDiscrepancyLineCount();
    }

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy"})
    @Query("select session from InventoryCountSession session where session.id = :id")
    Optional<InventoryCountSession> findHeaderById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy", "lines", "lines.product", "lines.binLocation", "lines.binLocation.warehouse", "lines.binLocation.zone"})
    @Query("select session from InventoryCountSession session where session.id = :id")
    Optional<InventoryCountSession> findWithLinesById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy"})
    @Query("select session from InventoryCountSession session where session.id = :id")
    Optional<InventoryCountSession> findHeaderByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy", "lines", "lines.product", "lines.binLocation", "lines.binLocation.warehouse", "lines.binLocation.zone"})
    @Query("select session from InventoryCountSession session where session.id = :id")
    Optional<InventoryCountSession> findWithLinesByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy"})
    List<InventoryCountSession> findByWarehouse_IdOrderByCreatedAtDesc(Long warehouseId);

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy"})
    List<InventoryCountSession> findByWarehouse_Company_IdOrderByCreatedAtDesc(Long companyId);

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy"})
    List<InventoryCountSession> findAllByOrderByCreatedAtDesc();

    @Query("""
            select session.id as sessionId,
                   count(line.id) as lineCount,
                   sum(case when line.countedQuantity is not null then 1L else 0L end) as countedLineCount,
                   sum(case when line.differenceQuantity <> 0 then 1L else 0L end) as discrepancyLineCount
            from InventoryCountSession session
            left join session.lines line
            where session.id in :sessionIds
            group by session.id
            """)
    List<InventoryCountSessionLineStats> findLineStatsBySessionIds(@Param("sessionIds") List<Long> sessionIds);

    boolean existsByWarehouse_IdAndStatusIn(Long warehouseId, List<InventoryCountSessionStatus> statuses);

    @Query("""
            select case when count(line) > 0 then true else false end
            from InventoryCountLine line
            join line.session session
            where session.warehouse.id = :warehouseId
            and line.product.id = :productId
            and session.status in :statuses
            """)
    boolean existsBlockingStockChangeForWarehouseProduct(@Param("warehouseId") Long warehouseId,
                                                         @Param("productId") Long productId,
                                                         @Param("statuses") List<InventoryCountSessionStatus> statuses);

    @Query("""
            select case when count(line) > 0 then true else false end
            from InventoryCountLine line
            join line.session session
            where session.warehouse.id = :warehouseId
            and line.product.id = :productId
            and line.binLocation.id = :binLocationId
            and session.status in :statuses
            """)
    boolean existsBlockingStockChangeForBinProduct(@Param("warehouseId") Long warehouseId,
                                                   @Param("productId") Long productId,
                                                   @Param("binLocationId") Long binLocationId,
                                                   @Param("statuses") List<InventoryCountSessionStatus> statuses);

}
