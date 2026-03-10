package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;

public class TaskMapper {

    public static Task toEntity(TaskCreate dto, Employee employee, TransportOrder transportOrder) {
        Task task = new Task(
                dto.getTitle(),
                dto.getDescription(),
                dto.getDueDate(),
                dto.getPriority(),
                dto.getStatus(),
                employee,
                transportOrder
        );
        return task;
    }

    public static void updateEntity(Task task, TaskUpdate dto, Employee employee, TransportOrder transportOrder) {
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setPriority(dto.getPriority());
        task.setStatus(dto.getStatus());
        task.setAssignedEmployee(employee);
        task.setTransportOrder(transportOrder);
    }

    public static TaskResponse toResponse(Task task) {
        TaskResponse taskResponse = new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getPriority(),
                task.getStatus(),
                task.getAssignedEmployee().getId(),
                task.getTransportOrder().getId()
        );
        return taskResponse;
    }
}
