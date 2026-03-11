package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ChangeType;

@Getter
@Setter
@NoArgsConstructor
public class ChangeHistoryCreate {

    private String entityName;
    private Long entityId;
    private ChangeType changeType;
    private String fieldName;
    private String oldValue;
    private String newValue;

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
