package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.StockMovement;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.time.LocalDateTime;
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

    long countByWarehouse_Company_Id(Long companyId);

    @Query("""
        select sm from StockMovement sm
        where (:companyId is null or sm.warehouse.company.id = :companyId)
        and (:movementType is null or sm.movementType = :movementType)
        and (:warehouseId is null or sm.warehouse.id = :warehouseId)
        and (:productId is null or sm.product.id = :productId)
        and (:transportOrderId is null or sm.transportOrder.id = :transportOrderId)
        and (:fromDate is null or sm.createdAt >= :fromDate)
        and (:toDate is null or sm.createdAt <= :toDate)
        and (
            :search is null
            or lower(sm.warehouse.name) like lower(concat('%', :search, '%'))
            or lower(sm.product.name) like lower(concat('%', :search, '%'))
            or lower(sm.referenceNumber) like lower(concat('%', :search, '%'))
            or lower(sm.reasonDescription) like lower(concat('%', :search, '%'))
            or (:searchId is not null and (sm.id = :searchId or sm.referenceId = :searchId))
        )
    """)
    Page<StockMovement> searchMovements(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("searchId") Long searchId,
            @Param("movementType") StockMovementType movementType,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("transportOrderId") Long transportOrderId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

}
