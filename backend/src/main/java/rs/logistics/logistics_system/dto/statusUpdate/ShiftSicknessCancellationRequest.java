package rs.logistics.logistics_system.dto.statusUpdate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShiftSicknessCancellationRequest {

    @NotBlank(message = "Cancellation reason is required")
    @Size(max = 255, message = "Cancellation reason must not exceed 255 characters")
    private String reason;
}
