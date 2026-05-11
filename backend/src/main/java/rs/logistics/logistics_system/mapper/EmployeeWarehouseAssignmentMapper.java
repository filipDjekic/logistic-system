package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.EmployeeWarehouseAssignmentResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.EmployeeWarehouseAssignment;
import rs.logistics.logistics_system.entity.Warehouse;

public class EmployeeWarehouseAssignmentMapper {
    public static EmployeeWarehouseAssignmentResponse toResponse(EmployeeWarehouseAssignment assignment) {
        Employee employee = assignment.getEmployee();
        Warehouse warehouse = assignment.getWarehouse();
        Company company = assignment.getCompany();

        EmployeeWarehouseAssignmentResponse response = new EmployeeWarehouseAssignmentResponse();
        response.setId(assignment.getId());
        response.setCompanyId(company != null ? company.getId() : null);
        response.setCompanyName(company != null ? company.getName() : null);
        response.setEmployeeId(employee != null ? employee.getId() : null);
        response.setEmployeeName(employee != null ? employee.getFirstName() + " " + employee.getLastName() : null);
        response.setEmployeePosition(employee != null ? employee.getPosition() : null);
        response.setWarehouseId(warehouse != null ? warehouse.getId() : null);
        response.setWarehouseName(warehouse != null ? warehouse.getName() : null);
        response.setWarehouseStatus(warehouse != null ? warehouse.getStatus() : null);
        response.setAccessType(assignment.getAccessType());
        response.setActive(assignment.getActive());
        response.setValidFrom(assignment.getValidFrom());
        response.setValidTo(assignment.getValidTo());
        response.setNotes(assignment.getNotes());
        response.setCreatedAt(assignment.getCreatedAt());
        response.setUpdatedAt(assignment.getUpdatedAt());
        return response;
    }
}
