package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.response.TemporalView;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.time.ZoneId;

public class TaskMapper {

    public static Task toEntity(TaskCreate dto, Employee employee, TransportOrder transportOrder, StockMovement stockMovement) {
        Task task = new Task(
                dto.getTitle(),
                dto.getDescription(),
                dto.getDueDate(),
                dto.getPriority(),
                dto.getTaskType(),
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
        task.setTaskType(dto.getTaskType());
        task.setAssignedEmployee(employee);
        task.setTransportOrder(transportOrder);
        task.setStockMovement(stockMovement);
    }

    public static TaskResponse toResponse(Task task) {
        return toResponse(task, null);
    }

    public static TaskResponse toResponse(Task task, TimeServiceDefinition timeService) {
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
        taskResponse.setVersion(task.getVersion());
        taskResponse.setTaskType(task.getTaskType());
        taskResponse.setStartedAt(task.getStartedAt());
        taskResponse.setCompletedAt(task.getCompletedAt());
        taskResponse.setCancelledAt(task.getCancelledAt());
        taskResponse.setCancelReason(task.getCancelReason());
        taskResponse.setOverdue(task.getDueDate() != null
                && task.getStatus() != null
                && task.getStatus() != rs.logistics.logistics_system.enums.TaskStatus.COMPLETED
                && task.getStatus() != rs.logistics.logistics_system.enums.TaskStatus.CANCELLED
                && task.getDueDate().isBefore(java.time.LocalDateTime.now()));

        if (timeService != null && task.getDueDate() != null) {
            ZoneId zoneId = timeService.zoneIdForTask(task);
            taskResponse.setDueDateTimezone(zoneId.getId());
            taskResponse.setDueDateView(new TemporalView(
                    task.getDueDate(),
                    timeService.toUtcInstant(task.getDueDate(), zoneId),
                    timeService.toOffsetDateTime(task.getDueDate(), zoneId),
                    zoneId.getId(),
                    zoneId.getId()
            ));
        }
        return taskResponse;
    }
}
