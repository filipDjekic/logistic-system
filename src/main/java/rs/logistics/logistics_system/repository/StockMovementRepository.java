package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByWarehouseId(Long warehouseId);

    List<StockMovement> findByProductId(Long productId);

    List<StockMovement> findByMovementType(StockMovementType movementType);

    List<StockMovement> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
