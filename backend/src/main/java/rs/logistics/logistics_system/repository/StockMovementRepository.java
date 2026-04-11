package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;

import java.util.List;
import java.util.Optional;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    Optional<StockMovement> findByIdAndWarehouse_Company_Id(Long id, Long companyId);

    List<StockMovement> findAllByWarehouse_Company_Id(Long companyId);

    List<StockMovement> findByTransportOrder_Id(Long transportOrderId);

    List<StockMovement> findByTransportOrder_IdAndWarehouse_Company_Id(Long transportOrderId, Long companyId);

    List<StockMovement> findByWarehouse_IdAndProduct_IdOrderByCreatedAtDesc(Long warehouseId, Long productId);

    List<StockMovement> findByWarehouse_IdAndProduct_IdAndWarehouse_Company_IdOrderByCreatedAtDesc(Long warehouseId, Long productId, Long companyId);

    List<StockMovement> findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc(
            StockMovementReferenceType referenceType,
            Long referenceId
    );

    List<StockMovement> findByReferenceTypeAndReferenceIdAndWarehouse_Company_IdOrderByCreatedAtDesc(
            StockMovementReferenceType referenceType,
            Long referenceId,
            Long companyId
    );
}
