package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.TaskPriority;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TaskUpdate {

    private Long id;

    @NotBlank
    @Size(min = 1, max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @NotNull
    private LocalDateTime dueDate;

    @NotNull
    private TaskPriority priority;

    @NotNull
    @Positive
    private Long assignedEmployeeId;

    @Positive
    private Long transportOrderId;

    public TaskUpdate(Long id,
                      String title,
                      String description,
                      LocalDateTime dueDate,
                      TaskPriority priority,
                      Long assignedEmployeeId,
                      Long transportOrderId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.assignedEmployeeId = assignedEmployeeId;
        this.transportOrderId = transportOrderId;
    }
}