package rs.logistics.logistics_system.dto.update;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ChangeType;

@Getter
@Setter
@NoArgsConstructor
public class ChangeHistoryUpdate {

    private Long id;

    private String entityName;
    private Long entityId;
    private ChangeType changeType;
    private String fieldName;
    private String oldValue;
    private String newValue;

    private Long userId;

    public ChangeHistoryUpdate(Long id, String entityName, Long entityId, ChangeType changeType, String fieldName, String oldValue, String newValue, Long userId) {
        this.id = id;
        this.entityName = entityName;
        this.entityId = entityId;
        this.changeType = changeType;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.userId = userId;
    }
}
