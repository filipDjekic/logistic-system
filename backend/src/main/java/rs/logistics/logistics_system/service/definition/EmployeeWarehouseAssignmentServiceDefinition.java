package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.EmployeeWarehouseAssignmentCreate;
import rs.logistics.logistics_system.dto.response.EmployeeWarehouseAssignmentResponse;
import rs.logistics.logistics_system.dto.update.EmployeeWarehouseAssignmentUpdate;

import java.util.List;

public interface EmployeeWarehouseAssignmentServiceDefinition {
    EmployeeWarehouseAssignmentResponse create(EmployeeWarehouseAssignmentCreate dto);
    EmployeeWarehouseAssignmentResponse update(Long id, EmployeeWarehouseAssignmentUpdate dto);
    List<EmployeeWarehouseAssignmentResponse> getByEmployee(Long employeeId);
    List<EmployeeWarehouseAssignmentResponse> getByWarehouse(Long warehouseId);
    void delete(Long id);
}
