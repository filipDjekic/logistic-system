package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class EmployeePrimaryWarehouseUpdate {
    @Positive private Long warehouseId;
}
