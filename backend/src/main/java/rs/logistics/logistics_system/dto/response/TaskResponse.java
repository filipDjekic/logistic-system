package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TaskResponse {

    public Long id;

    private String title;
    private String description;
    private LocalDateTime dueDate;
    private TaskPriority priority;;
    private TaskStatus status;

    private Long assignedEmployeeId;
    private Long transportOrderId;

    public TaskResponse(Long id, String title, String description, LocalDateTime dueDate, TaskPriority priority, TaskStatus status, Long assignedEmployeeId, Long transportOrderId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
        this.assignedEmployeeId = assignedEmployeeId;
        this.transportOrderId = transportOrderId;
    }
}
