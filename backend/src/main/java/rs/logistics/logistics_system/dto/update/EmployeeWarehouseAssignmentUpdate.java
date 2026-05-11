package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeWarehouseAssignmentUpdate {
    private EmployeeWarehouseAccessType accessType;
    private Boolean active;
    private LocalDate validFrom;
    private LocalDate validTo;

    @Size(max = 500)
    private String notes;
}
