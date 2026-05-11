package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TaskType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TaskResponse {

    private Long id;

    private String title;
    private String description;
    private LocalDateTime dueDate;
    private TemporalView dueDateView;
    private String dueDateTimezone;
    private TaskPriority priority;
    private TaskStatus status;
    private TaskType taskType;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancelReason;
    private boolean overdue;

    private Long assignedEmployeeId;
    private Long transportOrderId;
    private Long stockMovementId;

    public TaskResponse(Long id, String title, String description, LocalDateTime dueDate, TaskPriority priority, TaskStatus status, Long assignedEmployeeId, Long transportOrderId, Long stockMovementId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
        this.assignedEmployeeId = assignedEmployeeId;
        this.transportOrderId = transportOrderId;
        this.stockMovementId = stockMovementId;
    }
}
