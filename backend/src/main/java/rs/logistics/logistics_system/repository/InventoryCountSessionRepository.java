package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.InventoryCountSession;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;

import java.util.List;
import java.util.Optional;

public interface InventoryCountSessionRepository extends JpaRepository<InventoryCountSession, Long> {
    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "createdBy", "reviewedBy", "lines", "lines.product"})
    @Query("select session from InventoryCountSession session where session.id = :id")
    Optional<InventoryCountSession> findWithLinesById(@Param("id") Long id);

    List<InventoryCountSession> findByWarehouse_IdOrderByCreatedAtDesc(Long warehouseId);

    List<InventoryCountSession> findByWarehouse_Company_IdOrderByCreatedAtDesc(Long companyId);

    boolean existsByWarehouse_IdAndStatusIn(Long warehouseId, List<InventoryCountSessionStatus> statuses);
}
