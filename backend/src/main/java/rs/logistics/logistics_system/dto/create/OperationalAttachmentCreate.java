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
public class OperationalAttachmentCreate {
    @NotNull
    private OperationalEntityType entityType;

    @NotNull
    @Positive
    private Long entityId;

    @NotBlank
    @Size(max = 255)
    private String fileName;

    @Size(max = 120)
    private String contentType;

    @NotBlank
    @Size(max = 1000)
    private String fileUrl;

    @Positive
    private Long sizeBytes;

    @Size(max = 500)
    private String description;

    @Positive
    private Long companyId;
}
