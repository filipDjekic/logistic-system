package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.StockMovement;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    Optional<StockMovement> findByIdAndWarehouse_Company_Id(Long id, Long companyId);

    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    @Query("select sm from StockMovement sm where sm.id = :id")
    Optional<StockMovement> findByIdWithDetails(@Param("id") Long id);

    List<StockMovement> findAllByWarehouse_Company_Id(Long companyId);


    @Query("""
        select count(sm) > 0
        from StockMovement sm
        where sm.id = :stockMovementId
        and exists (
            select 1 from Task workerTask
            where workerTask.stockMovement = sm
            and workerTask.assignedEmployee.id = :employeeId
        )
    """)
    boolean existsAssignedWorkerTaskForStockMovement(@Param("stockMovementId") Long stockMovementId, @Param("employeeId") Long employeeId);

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


    boolean existsByReferenceTypeAndReferenceIdAndMovementTypeAndStatusNot(
            StockMovementReferenceType referenceType,
            Long referenceId,
            StockMovementType movementType,
            StockMovementStatus status
    );


    List<StockMovement> findByRootMovementIdOrderByCreatedAtAsc(Long rootMovementId);

    List<StockMovement> findByRootMovementIdAndWarehouse_Company_IdOrderByCreatedAtAsc(Long rootMovementId, Long companyId);

    List<StockMovement> findByParentMovementIdOrderByCreatedAtAsc(Long parentMovementId);

    List<StockMovement> findByTransferGroupIdOrderByCreatedAtAsc(String transferGroupId);

    List<StockMovement> findByTransferGroupIdAndWarehouse_Company_IdOrderByCreatedAtAsc(String transferGroupId, Long companyId);

    List<StockMovement> findByProduct_IdAndWarehouse_Company_IdOrderByCreatedAtAsc(Long productId, Long companyId);

    List<StockMovement> findByProduct_IdOrderByCreatedAtAsc(Long productId);

    boolean existsByWarehouse_Id(Long warehouseId);

    long countByWarehouse_Company_Id(Long companyId);


    @Query("select count(sm) from StockMovement sm where sm.warehouse.company.id = :companyId and sm.warehouse.id in :warehouseIds")
    long countByCompanyIdAndWarehouseIds(@Param("companyId") Long companyId, @Param("warehouseIds") java.util.Collection<Long> warehouseIds);


    @Query("select count(sm) from StockMovement sm where sm.warehouse.company.id = :companyId and sm.warehouse.id in :warehouseIds and sm.createdAt >= :fromDate")
    long countByCompanyIdAndWarehouseIdsAndCreatedAtAfter(@Param("companyId") Long companyId, @Param("warehouseIds") java.util.Collection<Long> warehouseIds, @Param("fromDate") LocalDateTime fromDate);

    @Query("""
            select sm
            from StockMovement sm
            join fetch sm.warehouse warehouse
            join fetch sm.product product
            where warehouse.company.id = :companyId
            and warehouse.id in :warehouseIds
            order by sm.createdAt desc
            """)
    List<StockMovement> findRecentByCompanyIdAndWarehouseIds(@Param("companyId") Long companyId, @Param("warehouseIds") java.util.Collection<Long> warehouseIds, Pageable pageable);


    long countByCreatedAtAfter(LocalDateTime fromDate);

    long countByWarehouse_Company_IdAndCreatedAtAfter(Long companyId, LocalDateTime fromDate);

    @Query("""
        select sm from StockMovement sm
        where (:companyId is null or sm.warehouse.company.id = :companyId)
        and (:movementType is null or sm.movementType = :movementType)
        and (:status is null or sm.status = :status)
        and (:reasonCode is null or sm.reasonCode = :reasonCode)
        and (:warehouseId is null or sm.warehouse.id = :warehouseId)
        and (:productId is null or sm.product.id = :productId)
        and (:transportOrderId is null or sm.transportOrder.id = :transportOrderId)
        and (:binLocationId is null or sm.sourceBin.id = :binLocationId or sm.destinationBin.id = :binLocationId)
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
    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    Page<StockMovement> searchMovements(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("searchId") Long searchId,
            @Param("movementType") StockMovementType movementType,
            @Param("status") StockMovementStatus status,
            @Param("reasonCode") StockMovementReasonCode reasonCode,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("transportOrderId") Long transportOrderId,
            @Param("binLocationId") Long binLocationId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );



    @Query("""
        select sm from StockMovement sm
        where sm.warehouse.company.id = :companyId
        and sm.warehouse.id in :warehouseIds
        and (:movementType is null or sm.movementType = :movementType)
        and (:status is null or sm.status = :status)
        and (:reasonCode is null or sm.reasonCode = :reasonCode)
        and (:warehouseId is null or sm.warehouse.id = :warehouseId)
        and (:productId is null or sm.product.id = :productId)
        and (:transportOrderId is null or sm.transportOrder.id = :transportOrderId)
        and (:binLocationId is null or sm.sourceBin.id = :binLocationId or sm.destinationBin.id = :binLocationId)
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
    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    Page<StockMovement> searchMovementsForWarehouseIds(
            @Param("companyId") Long companyId,
            @Param("warehouseIds") java.util.Collection<Long> warehouseIds,
            @Param("search") String search,
            @Param("searchId") Long searchId,
            @Param("movementType") StockMovementType movementType,
            @Param("status") StockMovementStatus status,
            @Param("reasonCode") StockMovementReasonCode reasonCode,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("transportOrderId") Long transportOrderId,
            @Param("binLocationId") Long binLocationId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );


    @Query("""
        select sm from StockMovement sm
        where (:companyId is null or sm.warehouse.company.id = :companyId)
        and exists (
            select 1 from Task workerTask
            where workerTask.stockMovement = sm
            and workerTask.assignedEmployee.id = :employeeId
        )
        and (:movementType is null or sm.movementType = :movementType)
        and (:status is null or sm.status = :status)
        and (:reasonCode is null or sm.reasonCode = :reasonCode)
        and (:warehouseId is null or sm.warehouse.id = :warehouseId)
        and (:productId is null or sm.product.id = :productId)
        and (:transportOrderId is null or sm.transportOrder.id = :transportOrderId)
        and (:binLocationId is null or sm.sourceBin.id = :binLocationId or sm.destinationBin.id = :binLocationId)
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
    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    Page<StockMovement> searchMovementsAssignedToEmployee(
            @Param("companyId") Long companyId,
            @Param("employeeId") Long employeeId,
            @Param("search") String search,
            @Param("searchId") Long searchId,
            @Param("movementType") StockMovementType movementType,
            @Param("status") StockMovementStatus status,
            @Param("reasonCode") StockMovementReasonCode reasonCode,
            @Param("warehouseId") Long warehouseId,
            @Param("productId") Long productId,
            @Param("transportOrderId") Long transportOrderId,
            @Param("binLocationId") Long binLocationId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );


    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    List<StockMovement> findByBatchLotNumberAndWarehouse_Company_IdOrderByCreatedAtDesc(String batchLotNumber, Long companyId);

    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    List<StockMovement> findByBatchLotNumberOrderByCreatedAtDesc(String batchLotNumber);

    @Query("""
        select sm from StockMovement sm
        where (:companyId is null or sm.warehouse.company.id = :companyId)
        and sm.serialNumbers is not null
        and lower(concat(',', sm.serialNumbers, ',')) like lower(concat('%,', :serialNumber, ',%'))
        order by sm.createdAt desc
    """)
    @EntityGraph(attributePaths = {
            "warehouse", "warehouse.company", "warehouse.timezone",
            "product", "product.company",
            "createdBy", "createdBy.company",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse",
            "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone"
    })
    List<StockMovement> findSerialHistory(@Param("serialNumber") String serialNumber, @Param("companyId") Long companyId);
}
