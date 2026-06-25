package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

public interface TransportOrderRepository extends JpaRepository<TransportOrder, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from TransportOrder t where t.id = :id")
    Optional<TransportOrder> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from TransportOrder t where t.id = :id and t.createdBy.company.id = :companyId")
    Optional<TransportOrder> findByIdAndCreatedByCompanyIdForUpdate(@Param("id") Long id, @Param("companyId") Long companyId);

    Optional<TransportOrder> findByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = {
            "sourceWarehouse", "sourceWarehouse.timezone", "sourceWarehouse.company", "sourceWarehouse.company.timezone",
            "destinationWarehouse", "destinationWarehouse.timezone", "destinationWarehouse.company", "destinationWarehouse.company.timezone",
            "vehicle", "vehicle.vehicleModel", "vehicle.vehicleModel.brand",
            "assignedEmployee", "assignedEmployee.user", "assignedEmployee.timezone", "assignedEmployee.company", "assignedEmployee.company.timezone", "assignedEmployee.primaryWarehouse", "assignedEmployee.primaryWarehouse.timezone",
            "createdBy", "createdBy.company", "createdBy.company.timezone"
    })
    Optional<TransportOrder> findByIdAndCreatedBy_Company_Id(Long id, Long companyId);

    @EntityGraph(attributePaths = {
            "sourceWarehouse", "sourceWarehouse.timezone", "sourceWarehouse.company", "sourceWarehouse.company.timezone",
            "destinationWarehouse", "destinationWarehouse.timezone", "destinationWarehouse.company", "destinationWarehouse.company.timezone",
            "vehicle", "vehicle.vehicleModel", "vehicle.vehicleModel.brand",
            "assignedEmployee", "assignedEmployee.user", "assignedEmployee.timezone", "assignedEmployee.company", "assignedEmployee.company.timezone", "assignedEmployee.primaryWarehouse", "assignedEmployee.primaryWarehouse.timezone",
            "createdBy", "createdBy.company", "createdBy.company.timezone"
    })
    @Query("select t from TransportOrder t where t.id = :id")
    Optional<TransportOrder> findByIdWithDetails(@Param("id") Long id);

    List<TransportOrder> findAllByCreatedBy_Company_Id(Long companyId);

    boolean existsByOrderNumber(String orderNumber);

    boolean existsByOrderNumberAndIdNot(String orderNumber, Long id);

    List<TransportOrder> findByStatus(TransportOrderStatus status);

    @Query("""
            select t
            from TransportOrder t
            join fetch t.createdBy createdBy
            left join fetch createdBy.company company
            left join fetch t.assignedEmployee assignedEmployee
            left join fetch assignedEmployee.user assignedUser
            where t.status in :statuses
            """)
    List<TransportOrder> findByStatusInWithNotificationContext(@Param("statuses") Collection<TransportOrderStatus> statuses);

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

    List<TransportOrder> findByAssignedEmployeeIdAndDepartureTimeBetweenAndStatusIn(
            Long assignedEmployeeId,
            LocalDateTime start,
            LocalDateTime end,
            Collection<TransportOrderStatus> statuses
    );


    List<TransportOrder> findBySourceWarehouseId(Long warehouseId);

    List<TransportOrder> findBySourceWarehouseIdAndCreatedBy_Company_Id(Long warehouseId, Long companyId);

    List<TransportOrder> findByDestinationWarehouseId(Long warehouseId);

    List<TransportOrder> findByDestinationWarehouseIdAndCreatedBy_Company_Id(Long warehouseId, Long companyId);

    boolean existsBySourceWarehouseIdOrDestinationWarehouseId(Long sourceWarehouseId, Long destinationWarehouseId);

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


    long countByStatusIn(Collection<TransportOrderStatus> statuses);

    long countByPlannedArrivalTimeBeforeAndStatusIn(LocalDateTime now, Collection<TransportOrderStatus> statuses);


    @Query("""
            select distinct t
            from TransportOrder t
            join fetch t.createdBy createdBy
            left join fetch createdBy.company company
            left join fetch t.assignedEmployee assignedEmployee
            left join fetch assignedEmployee.user assignedUser
            where (:companyId is null or company.id = :companyId)
            and t.status in :statuses
            and t.plannedArrivalTime is not null
            and t.plannedArrivalTime < :now
            """)
    List<TransportOrder> findOverdueActiveTransportsForMonitoring(@Param("companyId") Long companyId, @Param("statuses") Collection<TransportOrderStatus> statuses, @Param("now") LocalDateTime now);

    long countByCreatedBy_Company_IdAndPlannedArrivalTimeBeforeAndStatusIn(Long companyId, LocalDateTime now, Collection<TransportOrderStatus> statuses);


    long countByAssignedEmployee_User_IdAndStatusIn(Long userId, Collection<TransportOrderStatus> statuses);

    long countByAssignedEmployee_User_IdAndPlannedArrivalTimeBeforeAndStatusIn(Long userId, LocalDateTime now, Collection<TransportOrderStatus> statuses);

    @Query("""
            select count(t)
            from TransportOrder t
            where (:companyId is null or t.createdBy.company.id = :companyId)
            and t.status in :statuses
            and (
                (t.updatedAt is not null and t.updatedAt < :threshold)
                or (t.updatedAt is null and t.createdAt is not null and t.createdAt < :threshold)
            )
            """)
    long countStuckOperationalTransports(@Param("companyId") Long companyId, @Param("statuses") Collection<TransportOrderStatus> statuses, @Param("threshold") LocalDateTime threshold);

    @Query("""
            select t
            from TransportOrder t
            where (:companyId is null or t.createdBy.company.id = :companyId)
            and t.status in :statuses
            and t.plannedArrivalTime is not null
            order by t.plannedArrivalTime asc
            """)
    List<TransportOrder> findTopOperationalTransports(@Param("companyId") Long companyId, @Param("statuses") Collection<TransportOrderStatus> statuses, Pageable pageable);


    @Query("""
            select t
            from TransportOrder t
            where t.assignedEmployee.user.id = :userId
            and t.status in :statuses
            and t.plannedArrivalTime is not null
            order by t.plannedArrivalTime asc
            """)
    List<TransportOrder> findTopOperationalTransportsForDriver(@Param("userId") Long userId, @Param("statuses") Collection<TransportOrderStatus> statuses, Pageable pageable);

    @Query("""
            select t
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and t.status in :statuses
            and t.plannedArrivalTime is not null
            and (t.sourceWarehouse.id in :warehouseIds or t.destinationWarehouse.id in :warehouseIds)
            order by t.plannedArrivalTime asc
            """)
    List<TransportOrder> findTopOperationalTransportsForWarehouses(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("statuses") Collection<TransportOrderStatus> statuses, Pageable pageable);


    @Query("""
            select count(t)
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and t.status in :statuses
            and (t.sourceWarehouse.id in :warehouseIds or t.destinationWarehouse.id in :warehouseIds)
            """)
    long countByCompanyIdAndStatusInAndWarehouseIds(@Param("companyId") Long companyId, @Param("statuses") Collection<TransportOrderStatus> statuses, @Param("warehouseIds") Collection<Long> warehouseIds);

    @Query("select t.status, count(t) from TransportOrder t where t.createdBy.company.id = :companyId group by t.status")
    List<Object[]> countGroupedByStatusAndCompanyId(@Param("companyId") Long companyId);


    @Query("""
            select count(t)
            from TransportOrder t
            where t.assignedEmployee.user.id = :userId
            and t.status in :statuses
            and (
                (t.updatedAt is not null and t.updatedAt < :threshold)
                or (t.updatedAt is null and t.createdAt is not null and t.createdAt < :threshold)
            )
            """)
    long countStuckOperationalTransportsForDriver(@Param("userId") Long userId, @Param("statuses") Collection<TransportOrderStatus> statuses, @Param("threshold") LocalDateTime threshold);

    @Query("""
            select count(t)
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and t.status in :statuses
            and (t.sourceWarehouse.id in :warehouseIds or t.destinationWarehouse.id in :warehouseIds)
            and (
                (t.updatedAt is not null and t.updatedAt < :threshold)
                or (t.updatedAt is null and t.createdAt is not null and t.createdAt < :threshold)
            )
            """)
    long countStuckOperationalTransportsForWarehouses(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("statuses") Collection<TransportOrderStatus> statuses, @Param("threshold") LocalDateTime threshold);

    @Query("""
            select count(t)
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and t.status in :statuses
            and t.plannedArrivalTime < :now
            and (t.sourceWarehouse.id in :warehouseIds or t.destinationWarehouse.id in :warehouseIds)
            """)
    long countByCompanyIdAndWarehouseIdsAndPlannedArrivalTimeBeforeAndStatusIn(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("now") LocalDateTime now, @Param("statuses") Collection<TransportOrderStatus> statuses);

    @Query("""
            select t.status, count(t)
            from TransportOrder t
            where t.assignedEmployee.user.id = :userId
            group by t.status
            """)
    List<Object[]> countGroupedByStatusAndAssignedUserId(@Param("userId") Long userId);

    @Query("""
            select t.status, count(t)
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and (t.sourceWarehouse.id in :warehouseIds or t.destinationWarehouse.id in :warehouseIds)
            group by t.status
            """)
    List<Object[]> countGroupedByStatusAndCompanyIdAndWarehouseIds(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds);

    @Query("""
        select t
        from TransportOrder t
        left join t.sourceWarehouse sourceWarehouse
        left join t.destinationWarehouse destinationWarehouse
        left join t.vehicle vehicle
        left join t.assignedEmployee assignedEmployee
        left join assignedEmployee.user assignedUser
        where (:companyId is null or t.createdBy.company.id = :companyId)
        and (:driverUserId is null or assignedUser.id = :driverUserId)
        and (:workerEmployeeId is null or exists (
            select 1 from Task workerTask
            where workerTask.transportOrder = t
            and workerTask.assignedEmployee.id = :workerEmployeeId
        ))
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
            or lower(sourceWarehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(destinationWarehouse.name) like lower(concat('%', :search, '%'))
            or lower(destinationWarehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(vehicle.registrationNumber) like lower(concat('%', :search, '%'))
            or lower(vehicle.vehicleModel.brand.name) like lower(concat('%', :search, '%'))
            or lower(vehicle.vehicleModel.name) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.firstName) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.lastName) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.email) like lower(concat('%', :search, '%'))
        )
    """)
    @EntityGraph(attributePaths = {
            "sourceWarehouse", "sourceWarehouse.timezone", "sourceWarehouse.company",
            "destinationWarehouse", "destinationWarehouse.timezone", "destinationWarehouse.company",
            "vehicle", "vehicle.vehicleModel", "vehicle.vehicleModel.brand",
            "assignedEmployee", "assignedEmployee.user", "assignedEmployee.timezone", "assignedEmployee.company", "assignedEmployee.primaryWarehouse", "assignedEmployee.primaryWarehouse.timezone",
            "createdBy", "createdBy.company"
    })
    Page<TransportOrder> searchTransportOrders(
            @Param("companyId") Long companyId,
            @Param("driverUserId") Long driverUserId,
            @Param("workerEmployeeId") Long workerEmployeeId,
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


    @Query("""
        select count(t) > 0
        from Task t
        where t.transportOrder.id = :transportOrderId
        and t.assignedEmployee.id = :employeeId
    """)
    boolean existsAssignedWorkerTaskForTransportOrder(@Param("transportOrderId") Long transportOrderId, @Param("employeeId") Long employeeId);

    @Query("""
        select count(v) > 0
        from Vehicle v
        where v.id = :vehicleId
        and v.company.id = :companyId
    """)
    boolean existsVehicleInCompany(@Param("vehicleId") Long vehicleId, @Param("companyId") Long companyId);

    @Query("""
        select t.status, count(t)
        from TransportOrder t
        left join t.sourceWarehouse sourceWarehouse
        left join t.destinationWarehouse destinationWarehouse
        left join t.vehicle vehicle
        left join t.assignedEmployee assignedEmployee
        left join assignedEmployee.user assignedUser
        where (:companyId is null or t.createdBy.company.id = :companyId)
        and (:driverUserId is null or assignedUser.id = :driverUserId)
        and (:workerEmployeeId is null or exists (
            select 1 from Task workerTask
            where workerTask.transportOrder = t
            and workerTask.assignedEmployee.id = :workerEmployeeId
        ))
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
            or lower(sourceWarehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(destinationWarehouse.name) like lower(concat('%', :search, '%'))
            or lower(destinationWarehouse.city.name) like lower(concat('%', :search, '%'))
            or lower(vehicle.registrationNumber) like lower(concat('%', :search, '%'))
            or lower(vehicle.vehicleModel.brand.name) like lower(concat('%', :search, '%'))
            or lower(vehicle.vehicleModel.name) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.firstName) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.lastName) like lower(concat('%', :search, '%'))
            or lower(assignedEmployee.email) like lower(concat('%', :search, '%'))
        )
        group by t.status
    """)
    List<Object[]> countGroupedByStatusFiltered(
            @Param("companyId") Long companyId,
            @Param("driverUserId") Long driverUserId,
            @Param("workerEmployeeId") Long workerEmployeeId,
            @Param("priority") PriorityLevel priority,
            @Param("sourceWarehouseId") Long sourceWarehouseId,
            @Param("destinationWarehouseId") Long destinationWarehouseId,
            @Param("vehicleId") Long vehicleId,
            @Param("assignedEmployeeId") Long assignedEmployeeId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("search") String search
    );


    @Query("""
            select count(t)
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and (t.assignedEmployee is null or t.vehicle is null)
            """)
    long countUnassignedByCompanyId(@Param("companyId") Long companyId);

    @Query("""
            select count(distinct t.assignedEmployee.id)
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and t.assignedEmployee is not null
            and t.status in :statuses
            """)
    long countDistinctAssignedDriversByCompanyIdAndStatusIn(@Param("companyId") Long companyId, @Param("statuses") Collection<TransportOrderStatus> statuses);

    @Query("""
            select t
            from TransportOrder t
            left join fetch t.sourceWarehouse
            left join fetch t.destinationWarehouse
            left join fetch t.vehicle
            left join fetch t.assignedEmployee assignedEmployee
            where t.createdBy.company.id = :companyId
            order by t.createdAt desc
            """)
    List<TransportOrder> findRecentByCompanyId(@Param("companyId") Long companyId, Pageable pageable);

    long countByPlannedArrivalTimeBetweenAndStatusIn(LocalDateTime start, LocalDateTime end, Collection<TransportOrderStatus> statuses);

    long countByCreatedBy_Company_IdAndPlannedArrivalTimeBetweenAndStatusIn(Long companyId, LocalDateTime start, LocalDateTime end, Collection<TransportOrderStatus> statuses);

    long countByAssignedEmployee_User_IdAndPlannedArrivalTimeBetweenAndStatusIn(Long userId, LocalDateTime start, LocalDateTime end, Collection<TransportOrderStatus> statuses);

    @Query("""
            select count(t)
            from TransportOrder t
            where t.createdBy.company.id = :companyId
            and t.status in :statuses
            and t.plannedArrivalTime >= :start
            and t.plannedArrivalTime <= :end
            and (t.sourceWarehouse.id in :warehouseIds or t.destinationWarehouse.id in :warehouseIds)
            """)
    long countByCompanyIdAndWarehouseIdsAndPlannedArrivalTimeBetweenAndStatusIn(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("statuses") Collection<TransportOrderStatus> statuses);

}
