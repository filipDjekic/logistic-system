package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;

@Getter
@Setter
@NoArgsConstructor
public class DomainEventCreate {
    @NotNull
    private DomainEventType eventType;

    @NotNull
    private OperationalEntityType entityType;

    @NotNull
    @Positive
    private Long entityId;

    @Size(max = 255)
    private String entityIdentifier;

    @NotBlank
    @Size(max = 500)
    private String summary;

    @Size(max = 4000)
    private String payload;

    private Long companyId;
}
