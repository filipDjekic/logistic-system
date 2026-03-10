package rs.logistics.logistics_system.dto.create;

import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.time.LocalDateTime;

public class TaskCreate {

    private String title;
    private String description;
    private LocalDateTime dueDate;
    private TaskPriority priority;;
    private TaskStatus status;

    private Long assignedEmployeeId;
    private Long transportOrderId;

    public TaskCreate() {}

    public TaskCreate(String title, String description, LocalDateTime dueDate, TaskPriority priority, TaskStatus status, Long assignedEmployeeId, Long transportOrderId) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
        this.assignedEmployeeId = assignedEmployeeId;
        this.transportOrderId = transportOrderId;
    }

    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public LocalDateTime getDueDate() {
        return dueDate;
    }
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }
    public TaskPriority getPriority() {
        return priority;
    }
    public void setPriority(TaskPriority priority) {
        this.priority = priority;
    }
    public TaskStatus getStatus() {
        return status;
    }
    public void setStatus(TaskStatus status) {
        this.status = status;
    }
    public Long getAssignedEmployeeId() {
        return assignedEmployeeId;
    }
    public void setAssignedEmployeeId(Long assignedEmployeeId) {
        this.assignedEmployeeId = assignedEmployeeId;
    }
    public Long getTransportOrderId() {
        return transportOrderId;
    }
    public void setTransportOrderId(Long transportOrderId) {
        this.transportOrderId = transportOrderId;
    }
}
