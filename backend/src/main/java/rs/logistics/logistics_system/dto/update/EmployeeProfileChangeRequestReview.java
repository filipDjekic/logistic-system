package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeProfileChangeRequestReview {

    @Size(max = 1000)
    private String rejectionReason;
}
