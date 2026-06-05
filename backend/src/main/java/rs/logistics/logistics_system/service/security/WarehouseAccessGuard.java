package rs.logistics.logistics_system.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseAccessGuard {

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final EmployeeWarehouseAssignmentRepository employeeWarehouseAssignmentRepository;

    public void ensureCanReadWarehouse(Warehouse warehouse) {
        ensureWarehouseAccess(warehouse, false);
    }

    public void ensureCanMutateWarehouse(Warehouse warehouse) {
        ensureWarehouseAccess(warehouse, true);
    }

    public List<Long> assignedWarehouseIdsForScopedUser() {
        if (canReadAllWarehouses()) {
            return null;
        }

        Optional<Employee> employee = employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId());
        if (employee.isEmpty()) {
            return List.of();
        }

        return employeeWarehouseAssignmentRepository.findByEmployee_IdAndCompany_IdOrderByWarehouse_NameAsc(
                        employee.get().getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .stream()
                .filter(assignment -> Boolean.TRUE.equals(assignment.getActive()))
                .filter(assignment -> assignment.getWarehouse() != null && assignment.getWarehouse().getId() != null)
                .map(assignment -> assignment.getWarehouse().getId())
                .distinct()
                .toList();
    }

    public boolean canReadAllWarehouses() {
        return authenticatedUserProvider.isOverlord()
                || authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("DISPATCHER");
    }

    private void ensureWarehouseAccess(Warehouse warehouse, boolean write) {
        if (warehouse == null || warehouse.getId() == null) {
            throw new ResourceNotFoundException("Warehouse not found");
        }

        if (authenticatedUserProvider.isOverlord() || authenticatedUserProvider.isCompanyAdmin()) {
            return;
        }

        if (!write && authenticatedUserProvider.hasRole("DISPATCHER")) {
            return;
        }

        if ((authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER") || authenticatedUserProvider.hasRole("WORKER"))
                && hasAssignedWarehouseAccess(warehouse.getId())) {
            return;
        }

        throw new ResourceNotFoundException("Warehouse not found");
    }

    private boolean hasAssignedWarehouseAccess(Long warehouseId) {
        return employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId())
                .map(employee -> employeeWarehouseAssignmentRepository.existsByEmployee_IdAndWarehouse_IdAndActiveTrue(employee.getId(), warehouseId))
                .orElse(false);
    }
}
