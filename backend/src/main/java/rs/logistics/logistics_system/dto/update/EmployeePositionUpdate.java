package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeePosition;

@Getter @Setter
public class EmployeePositionUpdate {
    @NotNull private EmployeePosition position;
}
