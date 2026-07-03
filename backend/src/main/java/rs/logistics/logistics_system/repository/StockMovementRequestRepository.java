package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.StockMovementRequest;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;

import java.util.Collection;
import java.util.Optional;

public interface StockMovementRequestRepository extends JpaRepository<StockMovementRequest, Long> {
    Optional<StockMovementRequest> findByIdAndWarehouse_Company_Id(Long id, Long companyId);

    Page<StockMovementRequest> findByStatus(StockMovementRequestStatus status, Pageable pageable);

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
