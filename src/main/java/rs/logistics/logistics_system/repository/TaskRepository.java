package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedEmployeeId(Long assignedEmployeeId);

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByPriority(TaskPriority priority);

    List<Task> findByDueDateBefore(LocalDateTime date);

    List<Task> findByDueDateAfter(LocalDateTime date);
}
