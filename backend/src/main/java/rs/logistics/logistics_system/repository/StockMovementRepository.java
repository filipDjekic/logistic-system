package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;

import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByTransportOrder_Id(Long transportOrderId);

    List<StockMovement> findByWarehouse_IdAndProduct_IdOrderByCreatedAtDesc(Long warehouseId, Long productId);

    List<StockMovement> findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc(
            StockMovementReferenceType referenceType,
            Long referenceId
    );
}