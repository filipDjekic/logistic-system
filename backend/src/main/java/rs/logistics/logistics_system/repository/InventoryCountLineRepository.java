package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.InventoryCountLine;

import java.util.List;
import java.util.Optional;

public interface InventoryCountLineRepository extends JpaRepository<InventoryCountLine, Long> {
    List<InventoryCountLine> findBySession_IdOrderByProduct_NameAsc(Long sessionId);
    Optional<InventoryCountLine> findBySession_IdAndProduct_Id(Long sessionId, Long productId);
}
