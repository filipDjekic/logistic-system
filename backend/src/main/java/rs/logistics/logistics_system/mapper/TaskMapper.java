package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;

public class TaskMapper {

    public static Task toEntity(TaskCreate dto, Employee employee, TransportOrder transportOrder, StockMovement stockMovement) {
        Task task = new Task(
                dto.getTitle(),
                dto.getDescription(),
                dto.getDueDate(),
                dto.getPriority(),
                employee,
                transportOrder,
                stockMovement
        );
        return task;
    }

    public static void updateEntity(Task task, TaskUpdate dto, Employee employee, TransportOrder transportOrder, StockMovement stockMovement) {
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setPriority(dto.getPriority());
        task.setAssignedEmployee(employee);
        task.setTransportOrder(transportOrder);
        task.setStockMovement(stockMovement);
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
                task.getTransportOrder() != null ? task.getTransportOrder().getId() : null,
                task.getStockMovement() != null ? task.getStockMovement().getId() : null
        );
        return taskResponse;
    }
}
