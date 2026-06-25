package rs.logistics.logistics_system.dto.create;

import java.util.Map;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeProfileChangeRequestCreate {

    @NotEmpty
    @Size(max = 8)
    private Map<String, Object> requestedChanges;

    @Size(max = 1000)
    private String reason;
}
