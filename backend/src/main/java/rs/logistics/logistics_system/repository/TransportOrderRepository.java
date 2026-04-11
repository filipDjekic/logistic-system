package rs.logistics.logistics_system.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

public interface TransportOrderRepository extends JpaRepository<TransportOrder, Long> {

    Optional<TransportOrder> findByOrderNumber(String orderNumber);

    Optional<TransportOrder> findByIdAndCreatedBy_Company_Id(Long id, Long companyId);

    List<TransportOrder> findAllByCreatedBy_Company_Id(Long companyId);

    boolean existsByOrderNumber(String orderNumber);

    boolean existsByOrderNumberAndIdNot(String orderNumber, Long id);

    List<TransportOrder> findByStatus(TransportOrderStatus status);

    List<TransportOrder> findByStatusAndCreatedBy_Company_Id(TransportOrderStatus status, Long companyId);

    List<TransportOrder> findByVehicleId(Long vehicleId);

    List<TransportOrder> findByVehicleIdAndCreatedBy_Company_Id(Long vehicleId, Long companyId);

    List<TransportOrder> findByAssignedEmployeeId(Long assignedEmployeeId);

    List<TransportOrder> findByAssignedEmployeeIdAndCreatedBy_Company_Id(Long assignedEmployeeId, Long companyId);

    List<TransportOrder> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<TransportOrder> findByCreatedAtBetweenAndCreatedBy_Company_Id(LocalDateTime start, LocalDateTime end, Long companyId);

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, List<TransportOrderStatus> status);

    boolean existsByAssignedEmployeeIdAndStatusIn(Long assignedEmployeeId, List<TransportOrderStatus> status);

    boolean existsByVehicleIdAndStatusInAndIdNot(Long vehicleId, List<TransportOrderStatus> status, Long id);

    boolean existsByAssignedEmployeeIdAndStatusInAndIdNot(Long employeeId, List<TransportOrderStatus> statuses, Long id);

    List<TransportOrder> findBySourceWarehouseId(Long warehouseId);

    List<TransportOrder> findBySourceWarehouseIdAndCreatedBy_Company_Id(Long warehouseId, Long companyId);

    List<TransportOrder> findByDestinationWarehouseId(Long warehouseId);

    List<TransportOrder> findByDestinationWarehouseIdAndCreatedBy_Company_Id(Long warehouseId, Long companyId);

    @Query("""
        select count(t) > 0
        from TransportOrder t
        where t.vehicle.id = :vehicleId
        and t.status in :statuses
        and t.departureTime < :newEnd
        and t.plannedArrivalTime > :newStart
    """)
    boolean existsVehicleScheduleOverlap(
            @Param("vehicleId") Long vehicleId,
            @Param("statuses") Collection<TransportOrderStatus> statuses,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd
    );

    @Query("""
        select count(t) > 0
        from TransportOrder t
        where t.vehicle.id = :vehicleId
        and t.status in :statuses
        and t.id <> :transportOrderId
        and t.departureTime < :newEnd
        and t.plannedArrivalTime > :newStart
    """)
    boolean existsVehicleScheduleOverlapExcludingOrder(
            @Param("vehicleId") Long vehicleId,
            @Param("statuses") Collection<TransportOrderStatus> statuses,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd,
            @Param("transportOrderId") Long transportOrderId
    );

    @Query("""
        select count(t) > 0
        from TransportOrder t
        where t.assignedEmployee.id = :employeeId
        and t.status in :statuses
        and t.departureTime < :newEnd
        and t.plannedArrivalTime > :newStart
    """)
    boolean existsDriverScheduleOverlap(
            @Param("employeeId") Long employeeId,
            @Param("statuses") Collection<TransportOrderStatus> statuses,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd
    );

    @Query("""
        select count(t) > 0
        from TransportOrder t
        where t.assignedEmployee.id = :employeeId
        and t.status in :statuses
        and t.id <> :transportOrderId
        and t.departureTime < :newEnd
        and t.plannedArrivalTime > :newStart
    """)
    boolean existsDriverScheduleOverlapExcludingOrder(
            @Param("employeeId") Long employeeId,
            @Param("statuses") Collection<TransportOrderStatus> statuses,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd,
            @Param("transportOrderId") Long transportOrderId
    );

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, Collection<TransportOrderStatus> statuses);

    boolean existsByVehicleIdAndStatusInAndIdNot(Long vehicleId, Collection<TransportOrderStatus> statuses, Long id);

    boolean existsByVehicleId(Long vehicleId);
}
