package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CompanyRegistrationReject {
    @NotBlank
    @Size(max = 500)
    private String rejectionReason;
}
