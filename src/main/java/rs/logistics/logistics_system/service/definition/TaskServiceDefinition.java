package rs.logistics.logistics_system.service.definition;

import io.swagger.v3.oas.annotations.tags.Tags;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

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
