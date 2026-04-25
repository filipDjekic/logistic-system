package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByIdAndAssignedEmployee_Company_Id(Long id, Long companyId);

    List<Task> findAllByAssignedEmployee_Company_Id(Long companyId);

    List<Task> findByAssignedEmployeeId(Long assignedEmployeeId);

    List<Task> findByAssignedEmployeeIdAndAssignedEmployee_Company_Id(Long assignedEmployeeId, Long companyId);

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByStatusAndAssignedEmployee_Company_Id(TaskStatus status, Long companyId);

    List<Task> findByPriority(TaskPriority priority);

    List<Task> findByPriorityAndAssignedEmployee_Company_Id(TaskPriority priority, Long companyId);

    List<Task> findByDueDateBefore(LocalDateTime date);

    List<Task> findByDueDateBeforeAndAssignedEmployee_Company_Id(LocalDateTime date, Long companyId);

    List<Task> findByDueDateAfter(LocalDateTime date);

    List<Task> findByDueDateAfterAndAssignedEmployee_Company_Id(LocalDateTime date, Long companyId);

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
                or str(t.id) like concat('%', :search, '%')
                or str(transportOrder.id) like concat('%', :search, '%')
                or str(stockMovement.id) like concat('%', :search, '%')
            )
            """)
    Page<Task> searchTasks(
            @Param("companyId") Long companyId,
            @Param("assignedEmployeeId") Long assignedEmployeeId,
            @Param("search") String search,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("transportOrderId") Long transportOrderId,
            @Param("stockMovementId") Long stockMovementId,
            @Param("linkedProcessType") String linkedProcessType,
            Pageable pageable
    );

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
}
