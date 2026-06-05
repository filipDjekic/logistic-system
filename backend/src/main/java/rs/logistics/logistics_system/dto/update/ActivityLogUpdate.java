package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ActivityLogUpdate {

    @NotBlank
    @Size(min = 1, max = 100)
    private String action;

    @NotBlank
    @Size(min = 1, max = 100)
    private String entityName;

    @NotNull
    @Positive
    private Long entityId;

    @Size(max = 500)
    private String description;


    @NotNull
    @Positive
    private Long userId;

}
