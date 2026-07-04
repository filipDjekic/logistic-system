package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.OperationalEntityType;

@Getter
@Setter
@NoArgsConstructor
public class OperationalCommentCreate {
    @NotNull
    private OperationalEntityType entityType;

    @NotNull
    @Positive
    private Long entityId;

    @NotBlank
    @Size(max = 2000)
    private String content;

    private Boolean internalNote = false;

}
