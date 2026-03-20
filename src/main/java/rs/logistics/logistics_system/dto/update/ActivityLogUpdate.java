package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ActivityLogUpdate {

    public Long id;

    @NotBlank
    @Size(min = 1, max = 100)
    private String action;

    @NotBlank
    @Size(min = 1, max = 100)
    private String entityName;

    @NotNull
    private Long entityId;

    @Size(min = 1, max = 500)
    private String description;


    @NotNull
    private Long userId;

    public ActivityLogUpdate(Long id, String action, String entityName, Long entityId, String description, Long userId) {
        this.id = id;
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.description = description;
        this.userId = userId;
    }
}
