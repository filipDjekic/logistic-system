package rs.logistics.logistics_system.repository;

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
}
