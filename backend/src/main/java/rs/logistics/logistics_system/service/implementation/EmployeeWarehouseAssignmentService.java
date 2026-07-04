package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.EmployeeWarehouseAssignmentCreate;
import rs.logistics.logistics_system.dto.response.EmployeeWarehouseAssignmentResponse;
import rs.logistics.logistics_system.dto.update.EmployeeWarehouseAssignmentUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.EmployeeWarehouseAssignment;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.EmployeeWarehouseAssignmentMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.EmployeeWarehouseAssignmentServiceDefinition;
import rs.logistics.logistics_system.service.support.DomainScopeValidator;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeWarehouseAssignmentService implements EmployeeWarehouseAssignmentServiceDefinition {

    private final EmployeeWarehouseAssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final WarehouseRepository warehouseRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final DomainScopeValidator domainScopeValidator;
    private final WarehouseAccessGuard warehouseAccessGuard;
    private final AuditFacadeDefinition auditFacade;

    @Override
    @Transactional
    public EmployeeWarehouseAssignmentResponse create(EmployeeWarehouseAssignmentCreate dto) {
        Employee employee = resolveEmployee(dto.getEmployeeId());
        Warehouse warehouse = resolveWarehouse(dto.getWarehouseId());
        ensureWarehouseManagerCanManageWarehouse(warehouse);
        ensureWarehouseManagerCanManageEmployee(employee);
        validateAssignment(employee, warehouse, dto.getAccessType(), dto.getValidFrom(), dto.getValidTo());

        assignmentRepository.findByEmployee_IdAndWarehouse_Id(employee.getId(), warehouse.getId()).ifPresent(existing -> {
            throw new ConflictException("Employee already has warehouse assignment for this warehouse");
        });

        EmployeeWarehouseAssignment assignment = new EmployeeWarehouseAssignment();
        assignment.setCompany(employee.getCompany());
        assignment.setEmployee(employee);
        assignment.setWarehouse(warehouse);
        assignment.setAccessType(dto.getAccessType());
        assignment.setActive(dto.getActive() == null || dto.getActive());
        assignment.setValidFrom(dto.getValidFrom());
        assignment.setValidTo(dto.getValidTo());
        assignment.setNotes(dto.getNotes());
        EmployeeWarehouseAssignment saved = assignmentRepository.save(assignment);

        auditFacade.recordCreate("EMPLOYEE_WAREHOUSE_ASSIGNMENT", saved.getId(), employee.getEmail() + " -> " + warehouse.getName());
        return EmployeeWarehouseAssignmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeWarehouseAssignmentResponse update(Long id, EmployeeWarehouseAssignmentUpdate dto) {
        EmployeeWarehouseAssignment assignment = resolveAssignment(id);
        ensureWarehouseManagerCanManageWarehouse(assignment.getWarehouse());
        ensureWarehouseManagerCanManageEmployee(assignment.getEmployee());
        if (dto.getAccessType() != null) {
            validateAssignment(assignment.getEmployee(), assignment.getWarehouse(), dto.getAccessType(), dto.getValidFrom(), dto.getValidTo());
            assignment.setAccessType(dto.getAccessType());
        }
        if (dto.getActive() != null) {
            assignment.setActive(dto.getActive());
        }
        if (dto.getValidFrom() != null || dto.getValidTo() != null) {
            validateDateRange(dto.getValidFrom(), dto.getValidTo());
            assignment.setValidFrom(dto.getValidFrom());
            assignment.setValidTo(dto.getValidTo());
        }
        if (dto.getNotes() != null) {
            assignment.setNotes(dto.getNotes());
        }
        EmployeeWarehouseAssignment saved = assignmentRepository.save(assignment);
        auditFacade.log("UPDATE", "EMPLOYEE_WAREHOUSE_ASSIGNMENT", saved.getId(), saved.getEmployee().getEmail() + " -> " + saved.getWarehouse().getName(), "Employee warehouse assignment updated");
        return EmployeeWarehouseAssignmentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeWarehouseAssignmentResponse> getByEmployee(Long employeeId) {
        Employee employee = resolveEmployee(employeeId);
        ensureWarehouseManagerCanManageEmployee(employee);
        Long companyId = authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        List<EmployeeWarehouseAssignment> assignments = companyId == null
                ? assignmentRepository.findByEmployee_IdOrderByWarehouse_NameAsc(employee.getId())
                : assignmentRepository.findByEmployee_IdAndCompany_IdOrderByWarehouse_NameAsc(employee.getId(), companyId);
        return filterAssignmentsForWarehouseManager(assignments).stream()
                .map(EmployeeWarehouseAssignmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeWarehouseAssignmentResponse> getByWarehouse(Long warehouseId) {
        Warehouse warehouse = resolveWarehouse(warehouseId);
        Long companyId = authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        ensureWarehouseManagerCanManageWarehouse(warehouse);
        List<EmployeeWarehouseAssignment> assignments = companyId == null
                ? assignmentRepository.findByWarehouseOrdered(warehouse.getId())
                : assignmentRepository.findByWarehouseAndCompanyOrdered(warehouse.getId(), companyId);
        return assignments.stream().map(EmployeeWarehouseAssignmentMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        EmployeeWarehouseAssignment assignment = resolveAssignment(id);
        ensureWarehouseManagerCanManageWarehouse(assignment.getWarehouse());
        ensureWarehouseManagerCanManageEmployee(assignment.getEmployee());
        auditFacade.recordDelete("EMPLOYEE_WAREHOUSE_ASSIGNMENT", assignment.getId(), assignment.getEmployee().getEmail() + " -> " + assignment.getWarehouse().getName());
        assignmentRepository.delete(assignment);
    }

    private void ensureWarehouseManagerCanManageWarehouse(Warehouse warehouse) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return;
        }
        warehouseAccessGuard.ensureCanMutateWarehouse(warehouse);
    }

    private void ensureWarehouseManagerCanManageEmployee(Employee employee) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return;
        }
        if (!warehouseAccessGuard.canManageEmployeeForWarehouseAssignment(employee)) {
            throw new ForbiddenException("You cannot manage warehouse assignments for this employee");
        }
    }

    private List<EmployeeWarehouseAssignment> filterAssignmentsForWarehouseManager(List<EmployeeWarehouseAssignment> assignments) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return assignments;
        }
        return assignments.stream()
                .filter(assignment -> warehouseAccessGuard.canMutateWarehouse(assignment.getWarehouse()))
                .toList();
    }

    private Employee resolveEmployee(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }
        return employeeRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private Warehouse resolveWarehouse(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        }
        return warehouseRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    private EmployeeWarehouseAssignment resolveAssignment(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return assignmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee warehouse assignment not found"));
        }
        return assignmentRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Employee warehouse assignment not found"));
    }

    private void validateAssignment(Employee employee, Warehouse warehouse, EmployeeWarehouseAccessType accessType, LocalDate validFrom, LocalDate validTo) {
        if (accessType == null) {
            throw new BadRequestException("Access type is required");
        }
        domainScopeValidator.ensureSameCompany(employee.getCompany(), warehouse.getCompany(), "Employee and warehouse must belong to same company");
        domainScopeValidator.ensureOperationalWarehouseForAssignment(warehouse, "Warehouse is not operational");
        validateDateRange(validFrom, validTo);

        EmployeePosition position = employee.getPosition();
        if (accessType == EmployeeWarehouseAccessType.MANAGER && position != EmployeePosition.WAREHOUSE_MANAGER) {
            throw new BadRequestException("MANAGER warehouse access requires WAREHOUSE_MANAGER position");
        }
        if ((accessType == EmployeeWarehouseAccessType.WORKER || accessType == EmployeeWarehouseAccessType.PRIMARY)
                && position != EmployeePosition.WORKER && position != EmployeePosition.WAREHOUSE_MANAGER) {
            throw new BadRequestException("Worker warehouse access requires WORKER or WAREHOUSE_MANAGER position");
        }
        if (accessType == EmployeeWarehouseAccessType.DISPATCH && position != EmployeePosition.DISPATCHER && position != EmployeePosition.WAREHOUSE_MANAGER) {
            throw new BadRequestException("DISPATCH warehouse access requires DISPATCHER or WAREHOUSE_MANAGER position");
        }
    }

    private void validateDateRange(LocalDate validFrom, LocalDate validTo) {
        if (validFrom != null && validTo != null && validTo.isBefore(validFrom)) {
            throw new BadRequestException("validTo cannot be before validFrom");
        }
    }
}
