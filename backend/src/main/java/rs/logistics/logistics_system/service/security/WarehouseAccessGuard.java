package rs.logistics.logistics_system.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.LinkedHashSet;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseAccessGuard {

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final EmployeeWarehouseAssignmentRepository employeeWarehouseAssignmentRepository;
    private final WarehouseRepository warehouseRepository;

    public void ensureCanReadWarehouse(Warehouse warehouse) {
        ensureWarehouseAccess(warehouse, false);
    }

    public void ensureCanMutateWarehouse(Warehouse warehouse) {
        ensureWarehouseAccess(warehouse, true);
    }

    public boolean canReadWarehouse(Warehouse warehouse) {
        if (warehouse == null || warehouse.getId() == null) {
            return false;
        }

        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        if (authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("DISPATCHER")
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return belongsToAuthenticatedCompany(warehouse);
        }

        return (authenticatedUserProvider.hasRole("WORKER") || authenticatedUserProvider.hasRole("DRIVER"))
                && hasAssignedWarehouseReadAccess(warehouse.getId());
    }

    public boolean canReadWarehouse(Long warehouseId) {
        return warehouseId != null
                && warehouseRepository.findById(warehouseId)
                .map(this::canReadWarehouse)
                .orElse(false);
    }

    public boolean canMutateWarehouse(Warehouse warehouse) {
        if (warehouse == null || warehouse.getId() == null) {
            return false;
        }

        if (authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return belongsToAuthenticatedCompany(warehouse);
        }

        if (authenticatedUserProvider.hasRole("WORKER")) {
            return hasAssignedWarehouseWorkerMutationAccess(warehouse.getId());
        }

        return false;
    }

    public boolean canMutateWarehouse(Long warehouseId) {
        return warehouseId != null
                && warehouseRepository.findById(warehouseId)
                .map(this::canMutateWarehouse)
                .orElse(false);
    }


    public boolean canManageEmployeeForWarehouseAssignment(Employee targetEmployee) {
        if (targetEmployee == null || targetEmployee.getId() == null) {
            return false;
        }

        if (authenticatedUserProvider.isCompanyAdmin()) {
            return targetEmployee.getCompany() != null
                    && targetEmployee.getCompany().getId() != null
                    && targetEmployee.getCompany().getId().equals(
                            authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                    );
        }

        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return false;
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        if (targetEmployee.getCompany() == null || !companyId.equals(targetEmployee.getCompany().getId())) {
            return false;
        }

        return true;
    }

    public List<Long> assignedWarehouseIdsForScopedUser() {
        if (canReadAllWarehouses()) {
            return null;
        }

        Optional<Employee> employee = employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId());
        if (employee.isEmpty()) {
            return List.of();
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        List<Long> assignedWarehouseIds = employeeWarehouseAssignmentRepository.findActiveWarehouseIds(
                employee.get().getId(), companyId, LocalDate.now());

        if (employee.get().getPrimaryWarehouse() == null || employee.get().getPrimaryWarehouse().getId() == null) {
            return assignedWarehouseIds;
        }

        Long primaryWarehouseId = employee.get().getPrimaryWarehouse().getId();
        if (assignedWarehouseIds.contains(primaryWarehouseId)) {
            return assignedWarehouseIds;
        }

        return java.util.stream.Stream.concat(java.util.stream.Stream.of(primaryWarehouseId), assignedWarehouseIds.stream())
                .distinct()
                .toList();
    }

    public List<Long> managedWarehouseIdsForCurrentUser() {
        Optional<Employee> employee = employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId());
        if (employee.isEmpty()) {
            return List.of();
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        LinkedHashSet<Long> warehouseIds = warehouseRepository
                .findByManagerIdAndCompany_Id(employee.get().getId(), companyId)
                .stream()
                .map(Warehouse::getId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        employeeWarehouseAssignmentRepository.findActiveWarehouseIdsByAccessTypes(
                employee.get().getId(),
                companyId,
                List.of(EmployeeWarehouseAccessType.MANAGER),
                LocalDate.now()
        ).forEach(warehouseIds::add);
        return List.copyOf(warehouseIds);
    }

    public List<Long> mutationWarehouseIdsForScopedUser() {
        if (authenticatedUserProvider.isOverlord()) {
            return List.of();
        }

        if (authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return null;
        }

        Optional<Employee> employee = employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId());
        if (employee.isEmpty()) {
            return List.of();
        }

        Long employeeId = employee.get().getId();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        java.util.LinkedHashSet<Long> warehouseIds = new java.util.LinkedHashSet<>();

        if (employee.get().getPrimaryWarehouse() != null && employee.get().getPrimaryWarehouse().getId() != null) {
            warehouseIds.add(employee.get().getPrimaryWarehouse().getId());
        }

        if (authenticatedUserProvider.hasRole("WORKER")) {
            employeeWarehouseAssignmentRepository.findActiveWarehouseIdsByAccessTypes(
                    employeeId,
                    companyId,
                    List.of(EmployeeWarehouseAccessType.PRIMARY, EmployeeWarehouseAccessType.WORKER),
                    LocalDate.now()
            ).forEach(warehouseIds::add);
        }

        return java.util.List.copyOf(warehouseIds);
    }

    public boolean canReadAllWarehouses() {
        return authenticatedUserProvider.isOverlord()
                || authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("DISPATCHER")
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER");
    }

    private void ensureWarehouseAccess(Warehouse warehouse, boolean write) {
        if (warehouse == null || warehouse.getId() == null) {
            throw new ResourceNotFoundException("Warehouse not found");
        }

        if (write) {
            if (canMutateWarehouse(warehouse)) {
                return;
            }
            throw new ForbiddenException("You cannot modify this warehouse");
        }

        if (canReadWarehouse(warehouse)) {
            return;
        }

        throw new ResourceNotFoundException("Warehouse not found");
    }

    private boolean hasAssignedWarehouseReadAccess(Long warehouseId) {
        return hasAssignedWarehouseAccess(
                warehouseId,
                List.of(
                        EmployeeWarehouseAccessType.PRIMARY,
                        EmployeeWarehouseAccessType.MANAGER,
                        EmployeeWarehouseAccessType.WORKER,
                        EmployeeWarehouseAccessType.DISPATCH,
                        EmployeeWarehouseAccessType.VIEW_ONLY
                )
        );
    }

    private boolean belongsToAuthenticatedCompany(Warehouse warehouse) {
        return warehouse.getCompany() != null
                && warehouse.getCompany().getId() != null
                && warehouse.getCompany().getId().equals(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
    }


    private boolean hasAssignedWarehouseWorkerMutationAccess(Long warehouseId) {
        return hasAssignedWarehouseAccess(
                warehouseId,
                List.of(
                        EmployeeWarehouseAccessType.PRIMARY,
                        EmployeeWarehouseAccessType.WORKER
                )
        );
    }

    private boolean hasAssignedWarehouseAccess(Long warehouseId, List<EmployeeWarehouseAccessType> accessTypes) {
        return employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId())
                .map(employee -> {
                    if (employee.getPrimaryWarehouse() != null
                            && warehouseId.equals(employee.getPrimaryWarehouse().getId())) {
                        return true;
                    }

                    if (authenticatedUserProvider.hasRole("DRIVER")) {
                        return employeeWarehouseAssignmentRepository.findActiveWarehouseIds(
                                employee.getId(),
                                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(),
                                LocalDate.now()
                        ).contains(warehouseId);
                    }
                    return employeeWarehouseAssignmentRepository.hasActiveAccess(employee.getId(), warehouseId, accessTypes, LocalDate.now());
                })
                .orElse(false);
    }
}
