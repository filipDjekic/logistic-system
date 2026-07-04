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

    public boolean canMutateWarehouse(Warehouse warehouse) {
        if (warehouse == null || warehouse.getId() == null) {
            return false;
        }

        if (authenticatedUserProvider.isOverlord() || authenticatedUserProvider.isCompanyAdmin()) {
            return true;
        }

        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return hasAssignedWarehouseManagerMutationAccess(warehouse);
        }

        if (authenticatedUserProvider.hasRole("WORKER")) {
            return hasAssignedWarehouseWorkerMutationAccess(warehouse.getId());
        }

        return false;
    }


    public boolean canManageEmployeeForWarehouseAssignment(Employee targetEmployee) {
        if (targetEmployee == null || targetEmployee.getId() == null) {
            return false;
        }

        if (authenticatedUserProvider.isOverlord() || authenticatedUserProvider.isCompanyAdmin()) {
            return true;
        }

        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return false;
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        if (targetEmployee.getCompany() == null || !companyId.equals(targetEmployee.getCompany().getId())) {
            return false;
        }

        List<Long> managedWarehouseIds = mutationWarehouseIdsForScopedUser();
        if (managedWarehouseIds == null) {
            return true;
        }
        if (managedWarehouseIds.isEmpty()) {
            return false;
        }

        if (targetEmployee.getPrimaryWarehouse() != null
                && targetEmployee.getPrimaryWarehouse().getId() != null
                && managedWarehouseIds.contains(targetEmployee.getPrimaryWarehouse().getId())) {
            return true;
        }

        return employeeWarehouseAssignmentRepository.hasActiveAssignmentInWarehouses(
                targetEmployee.getId(),
                companyId,
                managedWarehouseIds,
                LocalDate.now()
        );
    }

    public List<Long> assignedWarehouseIdsForScopedUser() {
        if (canReadAllWarehouses()) {
            return null;
        }

        Optional<Employee> employee = employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId());
        if (employee.isEmpty()) {
            return List.of();
        }

        List<Long> assignedWarehouseIds = employeeWarehouseAssignmentRepository.findByEmployee_IdAndCompany_IdOrderByWarehouse_NameAsc(
                        employee.get().getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .stream()
                .filter(assignment -> Boolean.TRUE.equals(assignment.getActive()))
                .filter(assignment -> assignment.getWarehouse() != null && assignment.getWarehouse().getId() != null)
                .map(assignment -> assignment.getWarehouse().getId())
                .distinct()
                .toList();

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

    public List<Long> mutationWarehouseIdsForScopedUser() {
        if (authenticatedUserProvider.isOverlord() || authenticatedUserProvider.isCompanyAdmin()) {
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

        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            warehouseRepository.findByManagerIdAndCompany_Id(employeeId, companyId).stream()
                    .map(Warehouse::getId)
                    .filter(java.util.Objects::nonNull)
                    .forEach(warehouseIds::add);
            employeeWarehouseAssignmentRepository.findActiveWarehouseIdsByAccessTypes(
                    employeeId,
                    companyId,
                    List.of(EmployeeWarehouseAccessType.PRIMARY, EmployeeWarehouseAccessType.MANAGER),
                    LocalDate.now()
            ).forEach(warehouseIds::add);
        } else if (authenticatedUserProvider.hasRole("WORKER")) {
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

        if (write) {
            if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
                if (hasAssignedWarehouseManagerMutationAccess(warehouse)) {
                    return;
                }
                throw new ForbiddenException("You cannot modify this warehouse");
            }

            if (authenticatedUserProvider.hasRole("WORKER")
                    && hasAssignedWarehouseWorkerMutationAccess(warehouse.getId())) {
                return;
            }

            throw new ForbiddenException("You cannot modify this warehouse");
        }

        if ((authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER") || authenticatedUserProvider.hasRole("WORKER"))
                && hasAssignedWarehouseReadAccess(warehouse.getId())) {
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

    private boolean hasAssignedWarehouseManagerMutationAccess(Warehouse warehouse) {
        Long warehouseId = warehouse.getId();
        return employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId())
                .map(employee -> {
                    if (employee.getPrimaryWarehouse() != null
                            && warehouseId.equals(employee.getPrimaryWarehouse().getId())) {
                        return true;
                    }

                    if (warehouse.getManager() != null
                            && employee.getId() != null
                            && employee.getId().equals(warehouse.getManager().getId())) {
                        return true;
                    }

                    return employeeWarehouseAssignmentRepository.hasActiveAccess(
                            employee.getId(),
                            warehouseId,
                            List.of(
                                    EmployeeWarehouseAccessType.PRIMARY,
                                    EmployeeWarehouseAccessType.MANAGER
                            ),
                            LocalDate.now()
                    );
                })
                .orElse(false);
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

                    return employeeWarehouseAssignmentRepository.hasActiveAccess(
                            employee.getId(),
                            warehouseId,
                            accessTypes,
                            LocalDate.now()
                    );
                })
                .orElse(false);
    }
}
