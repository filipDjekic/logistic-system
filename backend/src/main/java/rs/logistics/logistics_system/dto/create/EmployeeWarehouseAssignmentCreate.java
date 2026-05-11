package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeWarehouseAssignmentCreate {
    @NotNull
    @Positive
    private Long employeeId;

    @NotNull
    @Positive
    private Long warehouseId;

    @NotNull
    private EmployeeWarehouseAccessType accessType;

    private Boolean active = true;
    private LocalDate validFrom;
    private LocalDate validTo;

    @Size(max = 500)
    private String notes;
}
