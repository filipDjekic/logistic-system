package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ChangeType;

@Getter
@Setter
@NoArgsConstructor
public class ChangeHistoryCreate {

    @NotNull
    @Size(min = 1, max = 100)
    private String entityName;

    @NotNull
    private Long entityId;

    @NotNull
    private ChangeType changeType;

    @NotBlank
    @Size(min = 1, max = 100)
    private String fieldName;

    @NotBlank
    @Size(min = 1, max = 1000)
    private String oldValue;

    @NotBlank
    @Size(min = 1, max = 1000)
    private String newValue;

    @NotNull
    private Long userId;

    public ChangeHistoryCreate(String entityName, Long entityId, ChangeType changeType, String fieldName, String oldValue, String newValue, Long userId) {
        this.entityName = entityName;
        this.entityId = entityId;
        this.changeType = changeType;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.userId = userId;
    }
}
