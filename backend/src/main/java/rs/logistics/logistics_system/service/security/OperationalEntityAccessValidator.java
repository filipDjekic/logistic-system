package rs.logistics.logistics_system.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;
import rs.logistics.logistics_system.repository.InternalWarehouseMovementRepository;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleMaintenanceRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationalEntityAccessValidator {

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeWarehouseAssignmentRepository employeeWarehouseAssignmentRepository;
    private final InternalWarehouseMovementRepository internalWarehouseMovementRepository;
    private final NotificationRepository notificationRepository;
    private final ProductRepository productRepository;
    private final ShiftRepository shiftRepository;
    private final StockMovementRepository stockMovementRepository;
    private final TaskRepository taskRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final VehicleMaintenanceRepository vehicleMaintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseRepository warehouseRepository;

    public void ensureCanAccess(OperationalEntityType entityType, Long entityId) {
        if (!canAccess(entityType, entityId)) {
            throw new ResourceNotFoundException("Operational entity not found");
        }
    }


    public void ensureCanCreateOperationalContent(OperationalEntityType entityType, Long entityId) {
        if (!canCreateOperationalContent(entityType, entityId)) {
            throw new ResourceNotFoundException("Operational entity not found");
        }
    }

    public boolean canCreateOperationalContent(OperationalEntityType entityType, Long entityId) {
        if (!canAccess(entityType, entityId)) {
            return false;
        }

        if (authenticatedUserProvider.isOverlord() || authenticatedUserProvider.isCompanyAdmin()) {
            return true;
        }

        return switch (entityType) {
            case WAREHOUSE -> authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                    && hasWarehouseManageAccess(entityId);
            case STOCK_MOVEMENT -> canCreateStockMovementOperationalContent(entityId);
            case INTERNAL_WAREHOUSE_MOVEMENT -> canCreateInternalWarehouseMovementOperationalContent(entityId);
            case WAREHOUSE_INVENTORY -> authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                    && hasWarehouseManageAccess(entityId);
            default -> true;
        };
    }


    public Long resolveEntityCompanyId(OperationalEntityType entityType, Long entityId) {
        if (entityType == null || entityId == null || entityType == OperationalEntityType.GENERAL) {
            return null;
        }

        return switch (entityType) {
            case COMPANY -> companyRepository.findById(entityId).map(company -> company.getId()).orElse(null);
            case EMPLOYEE -> employeeRepository.findById(entityId)
                    .map(employee -> employee.getCompany() != null ? employee.getCompany().getId() : null)
                    .orElse(null);
            case NOTIFICATION -> notificationRepository.findById(entityId)
                    .map(notification -> notification.getUser() != null && notification.getUser().getCompany() != null ? notification.getUser().getCompany().getId() : null)
                    .orElse(null);
            case PRODUCT -> productRepository.findById(entityId)
                    .map(product -> product.getCompany() != null ? product.getCompany().getId() : null)
                    .orElse(null);
            case SHIFT -> shiftRepository.findById(entityId)
                    .map(shift -> shift.getEmployee() != null && shift.getEmployee().getCompany() != null ? shift.getEmployee().getCompany().getId() : null)
                    .orElse(null);
            case STOCK_MOVEMENT -> stockMovementRepository.findById(entityId)
                    .map(movement -> movement.getWarehouse() != null && movement.getWarehouse().getCompany() != null ? movement.getWarehouse().getCompany().getId() : null)
                    .orElse(null);
            case INTERNAL_WAREHOUSE_MOVEMENT -> internalWarehouseMovementRepository.findById(entityId)
                    .map(movement -> movement.getWarehouse() != null && movement.getWarehouse().getCompany() != null ? movement.getWarehouse().getCompany().getId() : null)
                    .orElse(null);
            case TASK -> taskRepository.findById(entityId)
                    .map(task -> task.getAssignedEmployee() != null && task.getAssignedEmployee().getCompany() != null ? task.getAssignedEmployee().getCompany().getId() : null)
                    .orElse(null);
            case TRANSPORT_ORDER -> transportOrderRepository.findById(entityId)
                    .map(order -> order.getCreatedBy() != null && order.getCreatedBy().getCompany() != null ? order.getCreatedBy().getCompany().getId() : null)
                    .orElse(null);
            case VEHICLE -> vehicleRepository.findById(entityId)
                    .map(vehicle -> vehicle.getCompany() != null ? vehicle.getCompany().getId() : null)
                    .orElse(null);
            case VEHICLE_MAINTENANCE -> vehicleMaintenanceRepository.findById(entityId)
                    .map(maintenance -> maintenance.getCompany() != null ? maintenance.getCompany().getId() : null)
                    .orElse(null);
            case WAREHOUSE -> warehouseRepository.findById(entityId)
                    .map(warehouse -> warehouse.getCompany() != null ? warehouse.getCompany().getId() : null)
                    .orElse(null);
            case WAREHOUSE_INVENTORY -> warehouseInventoryRepository.findByWarehouse_Id(entityId)
                    .stream()
                    .findFirst()
                    .map(inventory -> inventory.getWarehouse() != null && inventory.getWarehouse().getCompany() != null ? inventory.getWarehouse().getCompany().getId() : null)
                    .orElseGet(() -> warehouseRepository.findById(entityId)
                            .map(warehouse -> warehouse.getCompany() != null ? warehouse.getCompany().getId() : null)
                            .orElse(null));
            case GENERAL -> null;
        };
    }

    public boolean canAccess(OperationalEntityType entityType, Long entityId) {
        if (entityType == null || entityId == null) {
            return false;
        }

        if (entityType == OperationalEntityType.GENERAL) {
            return false;
        }

        if (authenticatedUserProvider.isOverlord()) {
            return existsGlobally(entityType, entityId);
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Long currentUserId = authenticatedUserProvider.getAuthenticatedUserId();

        return switch (entityType) {
            case COMPANY -> companyRepository.findById(entityId)
                    .map(company -> companyId.equals(company.getId()))
                    .orElse(false);
            case EMPLOYEE -> employeeRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();
            case NOTIFICATION -> notificationRepository.findByIdAndUser_Company_Id(entityId, companyId)
                    .map(notification -> notification.getUser() != null && notification.getUser().getId().equals(currentUserId))
                    .orElse(false);
            case PRODUCT -> productRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();
            case SHIFT -> shiftRepository.findByIdAndEmployee_Company_Id(entityId, companyId).isPresent();
            case STOCK_MOVEMENT -> canAccessStockMovement(entityId, companyId, currentUserId);
            case INTERNAL_WAREHOUSE_MOVEMENT -> internalWarehouseMovementRepository.findById(entityId)
                    .map(movement -> movement.getWarehouse() != null
                            && movement.getWarehouse().getCompany() != null
                            && companyId.equals(movement.getWarehouse().getCompany().getId())
                            && (authenticatedUserProvider.isCompanyAdmin()
                                || authenticatedUserProvider.hasRole("DISPATCHER")
                                || hasWarehouseAccess(movement.getWarehouse().getId())))
                    .orElse(false);
            case TASK -> canAccessTask(entityId, companyId, currentUserId);
            case TRANSPORT_ORDER -> canAccessTransportOrder(entityId, companyId, currentUserId);
            case VEHICLE -> vehicleRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();
            case VEHICLE_MAINTENANCE -> vehicleMaintenanceRepository.findById(entityId)
                    .map(maintenance -> maintenance.getCompany() != null && companyId.equals(maintenance.getCompany().getId()))
                    .orElse(false);
            case WAREHOUSE -> warehouseRepository.findByIdAndCompany_Id(entityId, companyId)
                    .map(warehouse -> authenticatedUserProvider.isCompanyAdmin()
                            || authenticatedUserProvider.hasRole("DISPATCHER")
                            || hasWarehouseAccess(warehouse.getId()))
                    .orElse(false);
            case WAREHOUSE_INVENTORY -> canAccessWarehouseInventory(entityId, companyId);
            case GENERAL -> false;
        };
    }

    private boolean canAccessTask(Long taskId, Long companyId, Long currentUserId) {
        return taskRepository.findByIdAndAssignedEmployee_Company_Id(taskId, companyId)
                .map(task -> {
                    if (hasOperationalCoordinatorRole()) {
                        return true;
                    }

                    if (authenticatedUserProvider.hasRole("DRIVER") || authenticatedUserProvider.hasRole("WORKER")) {
                        return isAssignedToCurrentUser(task, currentUserId);
                    }

                    return false;
                })
                .orElse(false);
    }

    private boolean canAccessTransportOrder(Long transportOrderId, Long companyId, Long currentUserId) {
        return transportOrderRepository.findByIdAndCreatedBy_Company_Id(transportOrderId, companyId)
                .map(order -> {
                    if (authenticatedUserProvider.isCompanyAdmin()
                            || authenticatedUserProvider.hasRole("DISPATCHER")
                            || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
                        return true;
                    }

                    if (authenticatedUserProvider.hasRole("DRIVER")) {
                        return isAssignedToCurrentUser(order, currentUserId);
                    }

                    return false;
                })
                .orElse(false);
    }

    private boolean canAccessStockMovement(Long stockMovementId, Long companyId, Long currentUserId) {
        return stockMovementRepository.findByIdAndWarehouse_Company_Id(stockMovementId, companyId)
                .map(movement -> {
                    if (authenticatedUserProvider.isCompanyAdmin()
                            || authenticatedUserProvider.hasRole("DISPATCHER")) {
                        return true;
                    }

                    if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                            && movement.getWarehouse() != null
                            && hasWarehouseAccess(movement.getWarehouse().getId())) {
                        return true;
                    }

                    if (authenticatedUserProvider.hasRole("DRIVER")) {
                        return movement.getTransportOrder() != null && isAssignedToCurrentUser(movement.getTransportOrder(), currentUserId);
                    }

                    if (authenticatedUserProvider.hasRole("WORKER")) {
                        return hasAssignedTask(movement, currentUserId);
                    }

                    return false;
                })
                .orElse(false);
    }

    private boolean canAccessWarehouseInventory(Long warehouseId, Long companyId) {
        if (!(authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                || authenticatedUserProvider.hasRole("DISPATCHER"))) {
            return false;
        }

        boolean inCompany = warehouseInventoryRepository.findByWarehouse_Id(warehouseId)
                .stream()
                .anyMatch(inventory -> inventory.getWarehouse() != null
                        && inventory.getWarehouse().getCompany() != null
                        && companyId.equals(inventory.getWarehouse().getCompany().getId()))
                || warehouseRepository.findByIdAndCompany_Id(warehouseId, companyId).isPresent();

        if (!inCompany) {
            return false;
        }

        return authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("DISPATCHER")
                || hasWarehouseAccess(warehouseId);
    }

    private boolean hasOperationalCoordinatorRole() {
        return authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("HR_MANAGER")
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                || authenticatedUserProvider.hasRole("DISPATCHER");
    }


    private boolean canCreateStockMovementOperationalContent(Long stockMovementId) {
        if (authenticatedUserProvider.hasRole("DISPATCHER")) {
            return true;
        }

        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return false;
        }

        return stockMovementRepository.findById(stockMovementId)
                .map(StockMovement::getWarehouse)
                .map(warehouse -> hasWarehouseManageAccess(warehouse.getId()))
                .orElse(false);
    }

    private boolean canCreateInternalWarehouseMovementOperationalContent(Long movementId) {
        if (authenticatedUserProvider.hasRole("DISPATCHER")) {
            return true;
        }

        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return false;
        }

        return internalWarehouseMovementRepository.findById(movementId)
                .map(movement -> movement.getWarehouse() != null && hasWarehouseManageAccess(movement.getWarehouse().getId()))
                .orElse(false);
    }

    private boolean hasWarehouseManageAccess(Long warehouseId) {
        if (warehouseId == null) {
            return false;
        }

        Optional<Employee> employee = currentEmployee();
        if (employee.isEmpty() || employee.get().getId() == null) {
            return false;
        }

        if (employee.get().getPrimaryWarehouse() != null
                && warehouseId.equals(employee.get().getPrimaryWarehouse().getId())) {
            return true;
        }

        return employeeWarehouseAssignmentRepository.hasActiveAccess(
                employee.get().getId(),
                warehouseId,
                List.of(
                        EmployeeWarehouseAccessType.PRIMARY,
                        EmployeeWarehouseAccessType.MANAGER
                ),
                LocalDate.now()
        );
    }


    private boolean hasWarehouseAccess(Long warehouseId) {
        if (warehouseId == null) {
            return false;
        }

        Optional<Employee> employee = currentEmployee();
        if (employee.isEmpty() || employee.get().getId() == null) {
            return false;
        }

        if (employee.get().getPrimaryWarehouse() != null
                && warehouseId.equals(employee.get().getPrimaryWarehouse().getId())) {
            return true;
        }

        return employeeWarehouseAssignmentRepository.hasActiveAccess(
                employee.get().getId(),
                warehouseId,
                List.of(
                        EmployeeWarehouseAccessType.PRIMARY,
                        EmployeeWarehouseAccessType.MANAGER,
                        EmployeeWarehouseAccessType.WORKER,
                        EmployeeWarehouseAccessType.DISPATCH,
                        EmployeeWarehouseAccessType.VIEW_ONLY
                ),
                LocalDate.now()
        );
    }

    private Optional<Employee> currentEmployee() {
        return employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId());
    }

    private Optional<Long> currentEmployeeId() {
        return currentEmployee().map(Employee::getId);
    }

    private boolean isAssignedToCurrentUser(Task task, Long currentUserId) {
        return task.getAssignedEmployee() != null
                && task.getAssignedEmployee().getUser() != null
                && currentUserId.equals(task.getAssignedEmployee().getUser().getId());
    }

    private boolean isAssignedToCurrentUser(TransportOrder order, Long currentUserId) {
        return order.getAssignedEmployee() != null
                && order.getAssignedEmployee().getUser() != null
                && currentUserId.equals(order.getAssignedEmployee().getUser().getId());
    }

    private boolean hasAssignedTask(StockMovement movement, Long currentUserId) {
        if (movement.getTasks() == null) {
            return false;
        }

        return movement.getTasks().stream().anyMatch(task -> isAssignedToCurrentUser(task, currentUserId));
    }

    private boolean existsGlobally(OperationalEntityType entityType, Long entityId) {
        return switch (entityType) {
            case COMPANY -> companyRepository.existsById(entityId);
            case EMPLOYEE -> employeeRepository.existsById(entityId);
            case NOTIFICATION -> notificationRepository.existsById(entityId);
            case PRODUCT -> productRepository.existsById(entityId);
            case SHIFT -> shiftRepository.existsById(entityId);
            case STOCK_MOVEMENT -> stockMovementRepository.existsById(entityId);
            case INTERNAL_WAREHOUSE_MOVEMENT -> internalWarehouseMovementRepository.existsById(entityId);
            case TASK -> taskRepository.existsById(entityId);
            case TRANSPORT_ORDER -> transportOrderRepository.existsById(entityId);
            case VEHICLE -> vehicleRepository.existsById(entityId);
            case VEHICLE_MAINTENANCE -> vehicleMaintenanceRepository.existsById(entityId);
            case WAREHOUSE -> warehouseRepository.existsById(entityId);
            case WAREHOUSE_INVENTORY -> warehouseRepository.existsById(entityId) || warehouseInventoryRepository.existsByWarehouse_Id(entityId);
            case GENERAL -> false;
        };
    }
}
