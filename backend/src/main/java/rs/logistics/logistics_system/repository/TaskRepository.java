package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Task t where t.id = :id")
    Optional<Task> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Task t where t.id = :id and t.assignedEmployee.company.id = :companyId")
    Optional<Task> findByIdAndAssignedEmployeeCompanyIdForUpdate(@Param("id") Long id, @Param("companyId") Long companyId);

    @Query("""
            select t
            from Task t
            where t.transportOrder.id = :transportOrderId
            and t.taskType = :taskType
            and t.status in :statuses
            """)
    List<Task> findTransportTasksByTypeAndStatusIn(@Param("transportOrderId") Long transportOrderId, @Param("taskType") rs.logistics.logistics_system.enums.TaskType taskType, @Param("statuses") Collection<TaskStatus> statuses);

    @Query("""
            select count(t)
            from Task t
            where t.transportOrder.id = :transportOrderId
            and t.status in :statuses
            """)
    long countTransportTasksByStatusIn(@Param("transportOrderId") Long transportOrderId, @Param("statuses") Collection<TaskStatus> statuses);
    @EntityGraph(attributePaths = {
            "assignedEmployee", "assignedEmployee.user", "assignedEmployee.company", "assignedEmployee.timezone", "assignedEmployee.primaryWarehouse", "assignedEmployee.primaryWarehouse.timezone", "assignedEmployee.primaryWarehouse.company", "assignedEmployee.primaryWarehouse.company.timezone",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.sourceWarehouse.timezone", "transportOrder.sourceWarehouse.company", "transportOrder.sourceWarehouse.company.timezone", "transportOrder.destinationWarehouse", "transportOrder.destinationWarehouse.timezone", "transportOrder.destinationWarehouse.company", "transportOrder.destinationWarehouse.company.timezone",
            "stockMovement", "stockMovement.warehouse", "stockMovement.warehouse.timezone", "stockMovement.warehouse.company", "stockMovement.warehouse.company.timezone", "stockMovement.product"
    })
    Optional<Task> findByIdAndAssignedEmployee_Company_Id(Long id, Long companyId);

    @EntityGraph(attributePaths = {
            "assignedEmployee", "assignedEmployee.user", "assignedEmployee.company", "assignedEmployee.timezone", "assignedEmployee.primaryWarehouse", "assignedEmployee.primaryWarehouse.timezone", "assignedEmployee.primaryWarehouse.company", "assignedEmployee.primaryWarehouse.company.timezone",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.sourceWarehouse.timezone", "transportOrder.sourceWarehouse.company", "transportOrder.sourceWarehouse.company.timezone", "transportOrder.destinationWarehouse", "transportOrder.destinationWarehouse.timezone", "transportOrder.destinationWarehouse.company", "transportOrder.destinationWarehouse.company.timezone",
            "stockMovement", "stockMovement.warehouse", "stockMovement.warehouse.timezone", "stockMovement.warehouse.company", "stockMovement.warehouse.company.timezone", "stockMovement.product"
    })
    @Query("select t from Task t where t.id = :id")
    Optional<Task> findByIdWithDetails(@Param("id") Long id);

    List<Task> findAllByAssignedEmployee_Company_Id(Long companyId);

    List<Task> findByAssignedEmployeeId(Long assignedEmployeeId);

    List<Task> findByAssignedEmployeeIdAndAssignedEmployee_Company_Id(Long assignedEmployeeId, Long companyId);

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByStatusAndAssignedEmployee_Company_Id(TaskStatus status, Long companyId);

    List<Task> findByPriority(TaskPriority priority);

    List<Task> findByPriorityAndAssignedEmployee_Company_Id(TaskPriority priority, Long companyId);

    List<Task> findByDueDateBefore(LocalDateTime date);

    List<Task> findByDueDateBeforeAndAssignedEmployee_Company_Id(LocalDateTime date, Long companyId);

    @Query("""
            select t
            from Task t
            join fetch t.assignedEmployee employee
            left join fetch employee.user user
            where t.dueDate < :now
            and t.status in :openStatuses
            """)
    List<Task> findOverdueOpenTasks(@Param("now") LocalDateTime now, @Param("openStatuses") java.util.Collection<TaskStatus> openStatuses);


    @Query("""
            select distinct t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            left join fetch assignedEmployee.user assignedUser
            left join fetch assignedEmployee.company company
            where (:companyId is null or company.id = :companyId)
            and t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED
            """)
    List<Task> findBlockedTasksForMonitoring(@Param("companyId") Long companyId);

    @Query("""
            select distinct t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            left join fetch assignedEmployee.user assignedUser
            left join fetch assignedEmployee.company company
            where (:companyId is null or company.id = :companyId)
            and t.status in :statuses
            and (
                (t.updatedAt is not null and t.updatedAt < :threshold)
                or (t.updatedAt is null and t.createdAt is not null and t.createdAt < :threshold)
            )
            """)
    List<Task> findStuckTasksForMonitoring(@Param("companyId") Long companyId, @Param("statuses") Collection<TaskStatus> statuses, @Param("threshold") LocalDateTime threshold);

    List<Task> findByDueDateAfter(LocalDateTime date);

    List<Task> findByDueDateAfterAndAssignedEmployee_Company_Id(LocalDateTime date, Long companyId);


    long countByStatus(TaskStatus status);

    long countByStatusIn(Collection<TaskStatus> statuses);

    long countByAssignedEmployee_Company_IdAndStatus(Long companyId, TaskStatus status);

    long countByAssignedEmployee_Company_IdAndStatusIn(Long companyId, Collection<TaskStatus> statuses);

    long countByDueDateBeforeAndStatusIn(LocalDateTime now, Collection<TaskStatus> statuses);

    long countByAssignedEmployee_Company_IdAndDueDateBeforeAndStatusIn(Long companyId, LocalDateTime now, Collection<TaskStatus> statuses);


    long countByAssignedEmployee_User_IdAndStatus(Long userId, TaskStatus status);

    long countByAssignedEmployee_User_IdAndStatusIn(Long userId, Collection<TaskStatus> statuses);

    long countByAssignedEmployee_User_IdAndDueDateBeforeAndStatusIn(Long userId, LocalDateTime now, Collection<TaskStatus> statuses);

    @Query("""
            select count(t)
            from Task t
            where (:companyId is null or t.assignedEmployee.company.id = :companyId)
            and t.status in :statuses
            and (
                (t.updatedAt is not null and t.updatedAt < :threshold)
                or (t.updatedAt is null and t.createdAt is not null and t.createdAt < :threshold)
            )
            """)
    long countStuckOperationalTasks(@Param("companyId") Long companyId, @Param("statuses") Collection<TaskStatus> statuses, @Param("threshold") LocalDateTime threshold);

    @Query("""
            select count(t)
            from Task t
            where t.assignedEmployee.user.id = :userId
            and t.status in :statuses
            and (
                (t.updatedAt is not null and t.updatedAt < :threshold)
                or (t.updatedAt is null and t.createdAt is not null and t.createdAt < :threshold)
            )
            """)
    long countStuckOperationalTasksForUser(@Param("userId") Long userId, @Param("statuses") Collection<TaskStatus> statuses, @Param("threshold") LocalDateTime threshold);

    @Query("""
            select count(t)
            from Task t
            left join t.stockMovement stockMovement
            left join stockMovement.warehouse movementWarehouse
            left join t.transportOrder transportOrder
            left join transportOrder.sourceWarehouse sourceWarehouse
            left join transportOrder.destinationWarehouse destinationWarehouse
            where t.assignedEmployee.company.id = :companyId
            and t.status in :statuses
            and (
                (t.updatedAt is not null and t.updatedAt < :threshold)
                or (t.updatedAt is null and t.createdAt is not null and t.createdAt < :threshold)
            )
            and (
                movementWarehouse.id in :warehouseIds
                or (
                    transportOrder is not null
                    and t.taskType <> rs.logistics.logistics_system.enums.TaskType.DRIVING
                    and (sourceWarehouse.id in :warehouseIds or destinationWarehouse.id in :warehouseIds)
                )
            )
            """)
    long countStuckOperationalTasksForManagedWarehouses(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("statuses") Collection<TaskStatus> statuses, @Param("threshold") LocalDateTime threshold);

    @Query("""
            select t.status, count(t)
            from Task t
            where t.assignedEmployee.user.id = :userId
            group by t.status
            """)
    List<Object[]> countGroupedByStatusAndAssignedUserId(@Param("userId") Long userId);



    @Query("""
            select t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            where (:companyId is null or assignedEmployee.company.id = :companyId)
            and (
                t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED
                or (t.dueDate is not null and t.dueDate < :now and t.status in :openStatuses)
            )
            order by t.dueDate asc
            """)
    List<Task> findTopOperationalProblemTasks(@Param("companyId") Long companyId, @Param("now") LocalDateTime now, @Param("openStatuses") Collection<TaskStatus> openStatuses, Pageable pageable);





    @Query("""
            select t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            left join fetch t.transportOrder transportOrder
            left join fetch t.stockMovement stockMovement
            where assignedEmployee.user.id = :userId
            and (
                t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED
                or (t.dueDate is not null and t.dueDate < :now and t.status in :openStatuses)
            )
            order by case when t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED then 0 else 1 end, t.dueDate asc
            """)
    List<Task> findTopOperationalProblemTasksForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now, @Param("openStatuses") Collection<TaskStatus> openStatuses, Pageable pageable);



    @Query("""
            select t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            left join fetch t.transportOrder transportOrder
            left join fetch t.stockMovement stockMovement
            where (:companyId is null or assignedEmployee.company.id = :companyId)
            and transportOrder is not null
            and (
                t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED
                or (t.dueDate is not null and t.dueDate < :now and t.status in :openStatuses)
            )
            order by case when t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED then 0 else 1 end, t.dueDate asc
            """)
    List<Task> findTopOperationalTransportProblemTasks(@Param("companyId") Long companyId, @Param("now") LocalDateTime now, @Param("openStatuses") Collection<TaskStatus> openStatuses, Pageable pageable);



    @Query("""
            select t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            left join fetch t.transportOrder transportOrder
            left join fetch t.stockMovement stockMovement
            left join stockMovement.warehouse movementWarehouse
            left join transportOrder.sourceWarehouse sourceWarehouse
            left join transportOrder.destinationWarehouse destinationWarehouse
            where assignedEmployee.company.id = :companyId
            and (
                movementWarehouse.id in :warehouseIds
                or (
                    transportOrder is not null
                    and t.taskType <> rs.logistics.logistics_system.enums.TaskType.DRIVING
                    and (sourceWarehouse.id in :warehouseIds or destinationWarehouse.id in :warehouseIds)
                )
            )
            and (
                t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED
                or (t.dueDate is not null and t.dueDate < :now and t.status in :openStatuses)
            )
            order by case when t.status = rs.logistics.logistics_system.enums.TaskStatus.BLOCKED then 0 else 1 end, t.dueDate asc
            """)
    List<Task> findTopOperationalProblemTasksForManagedWarehouses(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("now") LocalDateTime now, @Param("openStatuses") Collection<TaskStatus> openStatuses, Pageable pageable);

    @Query("""
            select case when count(t) > 0 then true else false end
            from Task t
            where t.id = :taskId
            and t.status = :status
            and t.transportOrder is null
            and t.stockMovement is null
            and (t.updatedAt is null or t.updatedAt = t.createdAt)
            """)
    boolean canBeHardDeleted(@Param("taskId") Long taskId, @Param("status") TaskStatus status);


    @Query("select t.status, count(t) from Task t where t.assignedEmployee.company.id = :companyId group by t.status")
    List<Object[]> countGroupedByStatusAndCompanyId(@Param("companyId") Long companyId);

    long countByAssignedEmployee_Company_Id(Long companyId);

    long countByAssignedEmployee_Company_IdAndAssignedEmployee_Position(Long companyId, rs.logistics.logistics_system.enums.EmployeePosition position);

    long countByAssignedEmployee_Company_IdAndAssignedEmployee_PositionAndStatusIn(Long companyId, rs.logistics.logistics_system.enums.EmployeePosition position, Collection<TaskStatus> statuses);

    @Query("""
            select t.status, count(t)
            from Task t
            where t.assignedEmployee.company.id = :companyId
            and t.assignedEmployee.position = :position
            group by t.status
            """)
    List<Object[]> countGroupedByStatusAndCompanyIdAndAssignedPosition(@Param("companyId") Long companyId, @Param("position") rs.logistics.logistics_system.enums.EmployeePosition position);

    @Query("""
            select t.status, count(t)
            from Task t
            left join t.stockMovement stockMovement
            left join stockMovement.warehouse movementWarehouse
            left join t.transportOrder transportOrder
            left join transportOrder.sourceWarehouse sourceWarehouse
            left join transportOrder.destinationWarehouse destinationWarehouse
            where t.assignedEmployee.company.id = :companyId
            and (
                movementWarehouse.id in :warehouseIds
                or sourceWarehouse.id in :warehouseIds
                or destinationWarehouse.id in :warehouseIds
            )
            group by t.status
            """)
    List<Object[]> countGroupedByStatusForManagedWarehouses(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds);

    @Query("""
            select count(t)
            from Task t
            left join t.stockMovement stockMovement
            left join stockMovement.warehouse movementWarehouse
            left join t.transportOrder transportOrder
            left join transportOrder.sourceWarehouse sourceWarehouse
            left join transportOrder.destinationWarehouse destinationWarehouse
            where t.assignedEmployee.company.id = :companyId
            and (
                movementWarehouse.id in :warehouseIds
                or sourceWarehouse.id in :warehouseIds
                or destinationWarehouse.id in :warehouseIds
            )
            """)
    long countForManagedWarehouses(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds);

    @Query("""
            select count(t)
            from Task t
            left join t.stockMovement stockMovement
            left join stockMovement.warehouse movementWarehouse
            left join t.transportOrder transportOrder
            left join transportOrder.sourceWarehouse sourceWarehouse
            left join transportOrder.destinationWarehouse destinationWarehouse
            where t.assignedEmployee.company.id = :companyId
            and t.status in :statuses
            and (
                movementWarehouse.id in :warehouseIds
                or sourceWarehouse.id in :warehouseIds
                or destinationWarehouse.id in :warehouseIds
            )
            """)
    long countForManagedWarehousesAndStatusIn(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("statuses") Collection<TaskStatus> statuses);

    @Query("""
            select count(t)
            from Task t
            left join t.stockMovement stockMovement
            left join stockMovement.warehouse movementWarehouse
            left join t.transportOrder transportOrder
            left join transportOrder.sourceWarehouse sourceWarehouse
            left join transportOrder.destinationWarehouse destinationWarehouse
            where t.assignedEmployee.company.id = :companyId
            and t.dueDate < :now
            and t.status in :statuses
            and (
                movementWarehouse.id in :warehouseIds
                or (
                    transportOrder is not null
                    and t.taskType <> rs.logistics.logistics_system.enums.TaskType.DRIVING
                    and (sourceWarehouse.id in :warehouseIds or destinationWarehouse.id in :warehouseIds)
                )
            )
            """)
    long countForManagedWarehousesAndDueDateBeforeAndStatusIn(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("now") LocalDateTime now, @Param("statuses") Collection<TaskStatus> statuses);


    @Query("""
            select t
            from Task t
            join t.assignedEmployee assignedEmployee
            left join t.transportOrder transportOrder
            left join t.stockMovement stockMovement
            where (:companyId is null or assignedEmployee.company.id = :companyId)
            and (:assignedEmployeeId is null or assignedEmployee.id = :assignedEmployeeId)
            and (:status is null or t.status = :status)
            and (:priority is null or t.priority = :priority)
            and (:transportOrderId is null or transportOrder.id = :transportOrderId)
            and (:stockMovementId is null or stockMovement.id = :stockMovementId)
            and (:excludeTransportOrders = false or transportOrder is null)
            and (:requireTransportOrder = false or transportOrder is not null)
            and (
                :restrictManagedWarehouses = false
                or stockMovement.warehouse.id in :managedWarehouseIds
                or (
                    transportOrder is not null
                    and t.taskType <> rs.logistics.logistics_system.enums.TaskType.DRIVING
                    and (transportOrder.sourceWarehouse.id in :managedWarehouseIds or transportOrder.destinationWarehouse.id in :managedWarehouseIds)
                )
            )
            and (
                :linkedProcessType is null
                or (:linkedProcessType = 'UNLINKED' and transportOrder is null and stockMovement is null)
                or (:linkedProcessType = 'TRANSPORT_ORDER' and transportOrder is not null)
                or (:linkedProcessType = 'STOCK_MOVEMENT' and stockMovement is not null)
            )
            and (
                :search is null
                or lower(t.title) like lower(concat('%', :search, '%'))
                or lower(coalesce(t.description, '')) like lower(concat('%', :search, '%'))
                or lower(concat(assignedEmployee.firstName, ' ', assignedEmployee.lastName)) like lower(concat('%', :search, '%'))
                or (:searchId is not null and t.id = :searchId)
                or (:searchId is not null and transportOrder.id = :searchId)
                or (:searchId is not null and stockMovement.id = :searchId)
            )
            """)
    @EntityGraph(attributePaths = {
            "assignedEmployee", "assignedEmployee.user", "assignedEmployee.company", "assignedEmployee.timezone", "assignedEmployee.primaryWarehouse", "assignedEmployee.primaryWarehouse.timezone", "assignedEmployee.primaryWarehouse.company", "assignedEmployee.primaryWarehouse.company.timezone",
            "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.sourceWarehouse.timezone", "transportOrder.sourceWarehouse.company", "transportOrder.sourceWarehouse.company.timezone", "transportOrder.destinationWarehouse", "transportOrder.destinationWarehouse.timezone", "transportOrder.destinationWarehouse.company", "transportOrder.destinationWarehouse.company.timezone",
            "stockMovement", "stockMovement.warehouse", "stockMovement.warehouse.timezone", "stockMovement.warehouse.company", "stockMovement.warehouse.company.timezone", "stockMovement.product"
    })
    Page<Task> searchTasks(@Param("companyId") Long companyId, @Param("assignedEmployeeId") Long assignedEmployeeId, @Param("search") String search, @Param("searchId") Long searchId, @Param("status") TaskStatus status, @Param("priority") TaskPriority priority, @Param("transportOrderId") Long transportOrderId, @Param("stockMovementId") Long stockMovementId, @Param("excludeTransportOrders") boolean excludeTransportOrders, @Param("requireTransportOrder") boolean requireTransportOrder, @Param("restrictManagedWarehouses") boolean restrictManagedWarehouses, @Param("managedWarehouseIds") Collection<Long> managedWarehouseIds, @Param("linkedProcessType") String linkedProcessType, Pageable pageable);



    @Query("""
            select t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            left join fetch t.transportOrder transportOrder
            left join fetch t.stockMovement stockMovement
            where (:companyId is null or assignedEmployee.company.id = :companyId)
            and (:employeeId is null or assignedEmployee.id = :employeeId)
            and (:position is null or assignedEmployee.position = :position)
            and (:status is null or t.status = :status)
            and (:priority is null or t.priority = :priority)
            and (
                (:fromDate is null and :toDate is null)
                or (:fromDate is null and (t.createdAt <= :toDate or t.dueDate <= :toDate))
                or (:toDate is null and (t.createdAt >= :fromDate or t.dueDate >= :fromDate))
                or (t.createdAt between :fromDate and :toDate or t.dueDate between :fromDate and :toDate)
            )
            """)
    List<Task> searchReportTasks(@Param("companyId") Long companyId, @Param("employeeId") Long employeeId, @Param("position") rs.logistics.logistics_system.enums.EmployeePosition position, @Param("status") TaskStatus status, @Param("priority") TaskPriority priority, @Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);



    @Query("""
            select t
            from Task t
            join fetch t.assignedEmployee assignedEmployee
            left join fetch assignedEmployee.user user
            where t.transportOrder.id = :transportOrderId
            and t.status in :statuses
            """)
    List<Task> findOpenTasksByTransportOrderId(@Param("transportOrderId") Long transportOrderId, @Param("statuses") Collection<TaskStatus> statuses);

    @Query("select t.status, count(t) from Task t group by t.status")
    List<Object[]> countGroupedByStatus();

    @Query("""
            select count(t)
            from Task t
            where t.assignedEmployee.company.id = :companyId
            and t.assignedEmployee.position = rs.logistics.logistics_system.enums.EmployeePosition.HR_MANAGER
            """)
    long countHrTasksByCompany(@Param("companyId") Long companyId);

    @Query("""
            select t.status, count(t)
            from Task t
            where t.assignedEmployee.company.id = :companyId
            and t.assignedEmployee.position = rs.logistics.logistics_system.enums.EmployeePosition.HR_MANAGER
            group by t.status
            """)
    List<Object[]> countHrTasksGroupedByStatusAndCompany(@Param("companyId") Long companyId);
    @Query("""
            select t.status, count(t)
            from Task t
            join t.assignedEmployee assignedEmployee
            left join t.transportOrder transportOrder
            left join t.stockMovement stockMovement
            where (:companyId is null or assignedEmployee.company.id = :companyId)
            and (:assignedEmployeeId is null or assignedEmployee.id = :assignedEmployeeId)
            and (:priority is null or t.priority = :priority)
            and (:transportOrderId is null or transportOrder.id = :transportOrderId)
            and (:stockMovementId is null or stockMovement.id = :stockMovementId)
            and (:excludeTransportOrders = false or transportOrder is null)
            and (:requireTransportOrder = false or transportOrder is not null)
            and (
                :restrictManagedWarehouses = false
                or stockMovement.warehouse.id in :managedWarehouseIds
                or (
                    transportOrder is not null
                    and t.taskType <> rs.logistics.logistics_system.enums.TaskType.DRIVING
                    and (transportOrder.sourceWarehouse.id in :managedWarehouseIds or transportOrder.destinationWarehouse.id in :managedWarehouseIds)
                )
            )
            and (
                :linkedProcessType is null
                or (:linkedProcessType = 'UNLINKED' and transportOrder is null and stockMovement is null)
                or (:linkedProcessType = 'TRANSPORT_ORDER' and transportOrder is not null)
                or (:linkedProcessType = 'STOCK_MOVEMENT' and stockMovement is not null)
            )
            and (
                :search is null
                or lower(t.title) like lower(concat('%', :search, '%'))
                or lower(coalesce(t.description, '')) like lower(concat('%', :search, '%'))
                or lower(concat(assignedEmployee.firstName, ' ', assignedEmployee.lastName)) like lower(concat('%', :search, '%'))
                or (:searchId is not null and t.id = :searchId)
                or (:searchId is not null and transportOrder.id = :searchId)
                or (:searchId is not null and stockMovement.id = :searchId)
            )
            group by t.status
            """)
    List<Object[]> countGroupedByStatusFiltered(@Param("companyId") Long companyId, @Param("assignedEmployeeId") Long assignedEmployeeId, @Param("search") String search, @Param("searchId") Long searchId, @Param("priority") TaskPriority priority, @Param("transportOrderId") Long transportOrderId, @Param("stockMovementId") Long stockMovementId, @Param("excludeTransportOrders") boolean excludeTransportOrders, @Param("requireTransportOrder") boolean requireTransportOrder, @Param("restrictManagedWarehouses") boolean restrictManagedWarehouses, @Param("managedWarehouseIds") Collection<Long> managedWarehouseIds, @Param("linkedProcessType") String linkedProcessType);


    long countByDueDateBetweenAndStatusIn(LocalDateTime start, LocalDateTime end, Collection<TaskStatus> statuses);

    long countByAssignedEmployee_User_IdAndDueDateBetweenAndStatusIn(Long userId, LocalDateTime start, LocalDateTime end, Collection<TaskStatus> statuses);

    long countByAssignedEmployee_Company_IdAndDueDateBetweenAndStatusIn(Long companyId, LocalDateTime start, LocalDateTime end, Collection<TaskStatus> statuses);

    @Query("""
            select count(t)
            from Task t
            left join t.stockMovement stockMovement
            left join stockMovement.warehouse movementWarehouse
            left join t.transportOrder transportOrder
            left join transportOrder.sourceWarehouse sourceWarehouse
            left join transportOrder.destinationWarehouse destinationWarehouse
            where t.assignedEmployee.company.id = :companyId
            and t.status in :statuses
            and t.dueDate >= :start
            and t.dueDate <= :end
            and (
                movementWarehouse.id in :warehouseIds
                or (
                    transportOrder is not null
                    and t.taskType <> rs.logistics.logistics_system.enums.TaskType.DRIVING
                    and (sourceWarehouse.id in :warehouseIds or destinationWarehouse.id in :warehouseIds)
                )
            )
            """)
    long countForManagedWarehousesAndDueDateBetweenAndStatusIn(@Param("companyId") Long companyId, @Param("warehouseIds") Collection<Long> warehouseIds, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("statuses") Collection<TaskStatus> statuses);

}
