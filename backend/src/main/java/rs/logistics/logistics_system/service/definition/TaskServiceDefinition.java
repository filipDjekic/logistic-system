package rs.logistics.logistics_system.service.definition;

import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

public interface TaskServiceDefinition {

    @Transactional
    TaskResponse create(TaskCreate dto);

    @Transactional
    TaskResponse update(Long id, TaskUpdate dto);

    TaskResponse getById(Long id);

    PageResponse<TaskResponse> getAll(String search, TaskStatus status, TaskPriority priority, Long assignedEmployeeId, Long transportOrderId, Long stockMovementId, String linkedProcessType, Pageable pageable);

    PageResponse<TaskResponse> getMyTasks(String search, TaskStatus status, TaskPriority priority, Long transportOrderId, Long stockMovementId, String linkedProcessType, Pageable pageable);

    @Transactional
    void delete(Long id);

    @Transactional
    TaskResponse changeStatus(Long id, TaskStatus status);

    @Transactional
    TaskResponse assignTask(Long id, Long employeeId);
}
