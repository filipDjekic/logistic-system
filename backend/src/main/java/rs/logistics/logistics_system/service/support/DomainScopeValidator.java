package rs.logistics.logistics_system.service.support;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;

@Component
@RequiredArgsConstructor
public class DomainScopeValidator {

    private final EmployeeWarehouseAssignmentRepository employeeWarehouseAssignmentRepository;

    public void ensureSameCompany(Company expected, Company actual, String message) {
        Long expectedId = expected != null ? expected.getId() : null;
        Long actualId = actual != null ? actual.getId() : null;
        ensureSameCompany(expectedId, actualId, message);
    }

    public void ensureSameCompany(Long expectedCompanyId, Long actualCompanyId, String message) {
        if (expectedCompanyId == null || actualCompanyId == null || !expectedCompanyId.equals(actualCompanyId)) {
            throw new ForbiddenException(message);
        }
    }

    public void ensureEmployeeCanBelongToPrimaryWarehouse(Employee employee) {
        if (employee == null) {
            throw new BadRequestException("Employee is required");
        }

        Warehouse warehouse = employee.getPrimaryWarehouse();
        if (warehouse != null) {
            ensureSameCompany(employee.getCompany(), warehouse.getCompany(), "Primary warehouse does not belong to employee company");
            ensureOperationalWarehouseForAssignment(warehouse, "Primary warehouse is not operational");
        }

        EmployeePosition position = employee.getPosition();
        if (position == EmployeePosition.WORKER && warehouse == null) {
            throw new BadRequestException("WORKER must have primary warehouse");
        }
    }

    public void ensureWarehouseManager(Employee employee, Warehouse warehouse) {
        if (employee == null) {
            throw new BadRequestException("Warehouse manager is required");
        }
        if (employee.getPosition() != EmployeePosition.WAREHOUSE_MANAGER) {
            throw new BadRequestException("Only WAREHOUSE_MANAGER can manage warehouse");
        }
        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new BadRequestException("Inactive employee cannot manage warehouse");
        }
        if (employee.getCompany() == null || warehouse.getCompany() == null || !employee.getCompany().getId().equals(warehouse.getCompany().getId())) {
            throw new ForbiddenException("Warehouse manager must belong to warehouse company");
        }
    }

    public void ensureOperationalWarehouseForAssignment(Warehouse warehouse, String message) {
        if (warehouse == null) {
            throw new BadRequestException("Warehouse is required");
        }
        if (!Boolean.TRUE.equals(warehouse.getActive()) || warehouse.getStatus() != WarehouseStatus.ACTIVE) {
            throw new BadRequestException(message);
        }
    }

    public void ensureWarehouseLocationConsistency(Warehouse warehouse) {
        if (warehouse.getCountry() == null || warehouse.getCity() == null || warehouse.getTimezone() == null) {
            throw new BadRequestException("Warehouse country, city and timezone are required");
        }
        if (warehouse.getCity().getCountry() == null || !warehouse.getCity().getCountry().getId().equals(warehouse.getCountry().getId())) {
            throw new BadRequestException("Warehouse city does not belong to selected country");
        }
        if (warehouse.getTimezone().getCountry() == null || !warehouse.getTimezone().getCountry().getId().equals(warehouse.getCountry().getId())) {
            throw new BadRequestException("Warehouse timezone does not belong to selected country");
        }
    }

    public void ensureEmployeeLocationConsistency(Employee employee) {
        if (employee.getCity() != null && employee.getCountry() == null) {
            throw new BadRequestException("Employee country is required when city is selected");
        }
        if (employee.getCity() != null
                && employee.getCity().getCountry() != null
                && !employee.getCity().getCountry().getId().equals(employee.getCountry().getId())) {
            throw new BadRequestException("Employee city does not belong to selected country");
        }
        if (employee.getTimezone() != null && employee.getCountry() == null) {
            throw new BadRequestException("Employee country is required when timezone is selected");
        }
        if (employee.getTimezone() != null
                && employee.getTimezone().getCountry() != null
                && !employee.getTimezone().getCountry().getId().equals(employee.getCountry().getId())) {
            throw new BadRequestException("Employee timezone does not belong to selected country");
        }
    }

    public boolean hasWarehouseAccess(Employee employee, Warehouse warehouse, EmployeeWarehouseAccessType... acceptedTypes) {
        if (employee == null || warehouse == null || employee.getId() == null || warehouse.getId() == null) {
            return false;
        }
        if (employee.getPrimaryWarehouse() != null && employee.getPrimaryWarehouse().getId().equals(warehouse.getId())) {
            return true;
        }
        return employeeWarehouseAssignmentRepository.hasActiveAccess(
                employee.getId(),
                warehouse.getId(),
                java.util.Arrays.asList(acceptedTypes),
                java.time.LocalDate.now()
        );
    }
}
