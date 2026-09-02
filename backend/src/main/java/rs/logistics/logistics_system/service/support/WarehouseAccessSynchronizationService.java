package rs.logistics.logistics_system.service.support;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.EmployeeWarehouseAssignment;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class WarehouseAccessSynchronizationService {

    private final EmployeeWarehouseAssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditFacadeDefinition auditFacade;

    public void synchronizePrimaryWarehouse(Employee employee, Warehouse oldWarehouse, Warehouse newWarehouse) {
        if (oldWarehouse != null && (newWarehouse == null || !oldWarehouse.getId().equals(newWarehouse.getId()))) {
            closeCanonicalAssignment(employee, oldWarehouse, EmployeeWarehouseAccessType.PRIMARY);
        }
        if (newWarehouse != null) {
            ensureCanonicalAssignment(employee, newWarehouse, EmployeeWarehouseAccessType.PRIMARY);
        }
    }

    public void synchronizeWarehouseManager(Warehouse warehouse, Employee oldManager, Employee newManager) {
        if (oldManager != null && (newManager == null || !oldManager.getId().equals(newManager.getId()))) {
            closeCanonicalAssignment(oldManager, warehouse, EmployeeWarehouseAccessType.MANAGER);
        }

        if (newManager == null) {
            return;
        }

        if (newManager.getPrimaryWarehouse() == null) {
            newManager.setPrimaryWarehouse(warehouse);
            employeeRepository.save(newManager);
            auditFacade.recordFieldChange("EMPLOYEE", newManager.getId(), "primary_warehouse_id", null, warehouse.getId());
        }
        ensureCanonicalAssignment(newManager, warehouse, EmployeeWarehouseAccessType.MANAGER);
    }

    private void ensureCanonicalAssignment(Employee employee, Warehouse warehouse, EmployeeWarehouseAccessType canonicalType) {
        EmployeeWarehouseAssignment assignment = assignmentRepository
                .findByEmployee_IdAndWarehouse_Id(employee.getId(), warehouse.getId())
                .orElseGet(() -> newAssignment(employee, warehouse));

        EmployeeWarehouseAccessType oldType = assignment.getAccessType();
        boolean newAssignment = assignment.getId() == null;
        EmployeeWarehouseAccessType targetType = canonicalType == EmployeeWarehouseAccessType.PRIMARY
                && oldType == EmployeeWarehouseAccessType.MANAGER
                ? EmployeeWarehouseAccessType.MANAGER
                : canonicalType;
        boolean requiresUpdate = newAssignment
                || oldType != targetType
                || !Boolean.TRUE.equals(assignment.getActive())
                || assignment.getValidTo() != null
                || assignment.getValidFrom() == null
                || assignment.getValidFrom().isAfter(LocalDate.now());

        if (!requiresUpdate) {
            return;
        }

        // A manager assignment already grants effective access when this is also the employee's primary warehouse.
        assignment.setAccessType(targetType);
        assignment.setActive(true);
        if (assignment.getValidFrom() == null || assignment.getValidFrom().isAfter(LocalDate.now())) {
            assignment.setValidFrom(LocalDate.now());
        }
        assignment.setValidTo(null);

        EmployeeWarehouseAssignment saved = assignmentRepository.save(assignment);
        if (newAssignment) {
            auditFacade.recordCreate("EMPLOYEE_WAREHOUSE_ASSIGNMENT", saved.getId(), employee.getEmail() + " -> " + warehouse.getName());
        } else {
            auditFacade.log("UPDATE", "EMPLOYEE_WAREHOUSE_ASSIGNMENT", saved.getId(), employee.getEmail() + " -> " + warehouse.getName(),
                    "Warehouse access synchronized from " + oldType + " to " + saved.getAccessType());
        }
    }

    private void closeCanonicalAssignment(Employee employee, Warehouse warehouse, EmployeeWarehouseAccessType canonicalType) {
        assignmentRepository.findByEmployee_IdAndWarehouse_Id(employee.getId(), warehouse.getId())
                .filter(assignment -> assignment.getAccessType() == canonicalType)
                .ifPresent(assignment -> {
                    if (canonicalType == EmployeeWarehouseAccessType.MANAGER
                            && employee.getPrimaryWarehouse() != null
                            && warehouse.getId().equals(employee.getPrimaryWarehouse().getId())) {
                        assignment.setAccessType(EmployeeWarehouseAccessType.PRIMARY);
                        assignment.setActive(true);
                        assignment.setValidTo(null);
                    } else {
                        assignment.setActive(false);
                        assignment.setValidTo(LocalDate.now());
                    }
                    EmployeeWarehouseAssignment saved = assignmentRepository.save(assignment);
                    auditFacade.log("UPDATE", "EMPLOYEE_WAREHOUSE_ASSIGNMENT", saved.getId(), employee.getEmail() + " -> " + warehouse.getName(),
                            "Canonical warehouse access synchronized");
                });
    }

    private EmployeeWarehouseAssignment newAssignment(Employee employee, Warehouse warehouse) {
        EmployeeWarehouseAssignment assignment = new EmployeeWarehouseAssignment();
        assignment.setCompany(employee.getCompany());
        assignment.setEmployee(employee);
        assignment.setWarehouse(warehouse);
        return assignment;
    }
}
