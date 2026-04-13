package rs.logistics.logistics_system.service.definition;

import jakarta.transaction.Transactional;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.util.List;

public interface TaskServiceDefinition {

    @Transactional
    TaskResponse create(TaskCreate dto);

    @Transactional
    TaskResponse update(Long id, TaskUpdate dto);

    TaskResponse getById(Long id);

    List<TaskResponse> getAll();

    @Transactional
    void delete(Long id);

    @Transactional
    TaskResponse changeStatus(Long id, TaskStatus status);

    @Transactional
    TaskResponse assignTask(Long id, Long employeeId);
}
