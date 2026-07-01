package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TaskUpdate {

    @NotNull(message = "Version is required")
    private Long expectedVersion;

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
    private TaskType taskType;

    @NotNull
    @Positive
    private Long assignedEmployeeId;

    @Positive
    private Long transportOrderId;

    @Positive
    private Long stockMovementId;

}
