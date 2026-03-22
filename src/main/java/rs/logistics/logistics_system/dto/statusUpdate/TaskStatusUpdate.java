package rs.logistics.logistics_system.dto.statusUpdate;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.TaskStatus;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TaskStatusUpdate {

    @NotNull
    private TaskStatus status;
}
