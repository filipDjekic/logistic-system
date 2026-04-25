package rs.logistics.logistics_system.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.PriorityLevel;
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

    @Query("select t.status, count(t) from TransportOrder t group by t.status")
    List<Object[]> countGroupedByStatus();

    long countByCreatedBy_Company_Id(Long companyId);

    long countByCreatedBy_Company_IdAndStatusIn(Long companyId, Collection<TransportOrderStatus> statuses);

    @Query("select t.status, count(t) from TransportOrder t where t.createdBy.company.id = :companyId group by t.status")
    List<Object[]> countGroupedByStatusAndCompanyId(@Param("companyId") Long companyId);

    @Query("""
        select distinct t
        from TransportOrder t
        left join t.sourceWarehouse sourceWarehouse
        left join t.destinationWarehouse destinationWarehouse
        left join t.vehicle vehicle
        left join t.assignedEmployee assignedEmployee
        left join assignedEmployee.user assignedUser
        where (:companyId is null or t.createdBy.company.id = :companyId)
        and (:driverUserId is null or assignedUser.id = :driverUserId)
        and (:status is null or t.status = :status)
        and (:priority is null or t.priority = :priority)
        and (:sourceWarehouseId is null or sourceWarehouse.id = :sourceWarehouseId)
        and (:destinationWarehouseId is null or destinationWarehouse.id = :destinationWarehouseId)
        and (:vehicleId is null or vehicle.id = :vehicleId)
        and (:assignedEmployeeId is null or assignedEmployee.id = :assignedEmployeeId)
        and (:fromDate is null or t.departureTime >= :fromDate)
        and (:toDate is null or t.departureTime <= :toDate)
        and (
            :search is null
            or lower(t.orderNumber) like lower(concat('%', :search, '%'))
            or lower(t.description) like lower(concat('%', :search, '%'))
            or lower(coalesce(t.notes, '')) like lower(concat('%', :search, '%'))
            or lower(sourceWarehouse.name) like lower(concat('%', :search, '%'))
            or lower(sourceWarehouse.city) like lower(concat('%', :search, '%'))
            or lower(destinationWarehouse.name) like lower(concat('%', :search, '%'))
            or lower(destinationWarehouse.city) like lower(concat('%', :search, '%'))
            or lower(vehicle.registrationNumber) like lower(concat('%', :search, '%'))
            or lower(vehicle.brand) like lower(concat('%', :search, '%'))
            or lower(vehicle.model) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.firstName) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.lastName) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.email) like lower(concat('%', :search, '%'))
        )
    """)
    Page<TransportOrder> searchTransportOrders(
            @Param("companyId") Long companyId,
            @Param("driverUserId") Long driverUserId,
            @Param("status") TransportOrderStatus status,
            @Param("priority") PriorityLevel priority,
            @Param("sourceWarehouseId") Long sourceWarehouseId,
            @Param("destinationWarehouseId") Long destinationWarehouseId,
            @Param("vehicleId") Long vehicleId,
            @Param("assignedEmployeeId") Long assignedEmployeeId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("search") String search,
            Pageable pageable
    );
}
