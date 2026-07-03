package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.StockMovementRequest;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface StockMovementRequestRepository extends JpaRepository<StockMovementRequest, Long> {
    Optional<StockMovementRequest> findByIdAndWarehouse_Company_Id(Long id, Long companyId);

    Page<StockMovementRequest> findByStatus(StockMovementRequestStatus status, Pageable pageable);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update StockMovementRequest smr
            set smr.status = :approvedStatus,
                smr.reviewNote = :reviewNote,
                smr.reviewedBy = :reviewedBy,
                smr.reviewedAt = :reviewedAt,
                smr.version = smr.version + 1
            where smr.id = :id
              and smr.status = :requestedStatus
              and smr.version = :expectedVersion
            """)
    int approveIfRequestedAndVersionMatches(@Param("id") Long id,
                                             @Param("expectedVersion") Long expectedVersion,
                                             @Param("requestedStatus") StockMovementRequestStatus requestedStatus,
                                             @Param("approvedStatus") StockMovementRequestStatus approvedStatus,
                                             @Param("reviewNote") String reviewNote,
                                             @Param("reviewedBy") User reviewedBy,
                                             @Param("reviewedAt") LocalDateTime reviewedAt);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update StockMovementRequest smr
            set smr.createdMovement = :createdMovement,
                smr.version = smr.version + 1
            where smr.id = :id
              and smr.status = :approvedStatus
              and smr.createdMovement is null
            """)
    int attachCreatedMovementIfMissing(@Param("id") Long id,
                                       @Param("approvedStatus") StockMovementRequestStatus approvedStatus,
                                       @Param("createdMovement") StockMovement createdMovement);

    @Query("""
            select smr from StockMovementRequest smr
            where smr.warehouse.company.id = :companyId
              and (:status is null or smr.status = :status)
            """)
    Page<StockMovementRequest> searchByCompany(@Param("companyId") Long companyId,
                                                @Param("status") StockMovementRequestStatus status,
                                                Pageable pageable);

    @Query("""
            select smr from StockMovementRequest smr
            where smr.warehouse.company.id = :companyId
              and smr.warehouse.id in :warehouseIds
              and (:status is null or smr.status = :status)
            """)
    Page<StockMovementRequest> searchByWarehouseIds(@Param("companyId") Long companyId,
                                                     @Param("warehouseIds") Collection<Long> warehouseIds,
                                                     @Param("status") StockMovementRequestStatus status,
                                                     Pageable pageable);

    @Query("""
            select smr from StockMovementRequest smr
            where smr.requestedBy.id = :userId
              and (:status is null or smr.status = :status)
            """)
    Page<StockMovementRequest> searchByRequestedBy(@Param("userId") Long userId,
                                                    @Param("status") StockMovementRequestStatus status,
                                                    Pageable pageable);
}
