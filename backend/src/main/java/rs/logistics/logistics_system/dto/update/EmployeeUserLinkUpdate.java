package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class EmployeeUserLinkUpdate {
    @NotNull @Positive private Long userId;
}
