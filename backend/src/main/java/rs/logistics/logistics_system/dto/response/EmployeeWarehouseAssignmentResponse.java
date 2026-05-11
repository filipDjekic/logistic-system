package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeWarehouseAssignmentResponse {
    private Long id;
    private Long companyId;
    private String companyName;
    private Long employeeId;
    private String employeeName;
    private EmployeePosition employeePosition;
    private Long warehouseId;
    private String warehouseName;
    private WarehouseStatus warehouseStatus;
    private EmployeeWarehouseAccessType accessType;
    private Boolean active;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
