package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ChangeType;

@Getter
@Setter
@NoArgsConstructor
public class ChangeHistoryUpdate {

    @NotBlank
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
    @Positive
    private Long userId;

}
