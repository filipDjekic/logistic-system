package rs.logistics.logistics_system.service.definition;

import org.springframework.web.bind.annotation.PathVariable;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.util.List;

public interface TaskServiceDefinition {

    TaskResponse create(TaskCreate dto);

    TaskResponse update(Long id, TaskUpdate dto);

    TaskResponse getById(Long id);

    List<TaskResponse> getAll();

    void delete(Long id);

    TaskResponse changeStatus(Long id, TaskStatus status);
}
