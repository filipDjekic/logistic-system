package rs.logistics.logistics_system.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.util.Set;

@Component("authorization")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthorizationService {

    private static final Set<String> STOCK_READ_ROLES = Set.of(
            "OVERLORD", "COMPANY_ADMIN", "WAREHOUSE_MANAGER", "DISPATCHER", "DRIVER", "WORKER");
    private static final Set<String> STOCK_CREATE_ROLES = Set.of(
            "COMPANY_ADMIN", "WAREHOUSE_MANAGER");
    private static final Set<String> STOCK_LIFECYCLE_ROLES = Set.of(
            "COMPANY_ADMIN", "WAREHOUSE_MANAGER", "DISPATCHER");

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final OperationalEntityAccessValidator entityAccessValidator;
    private final ShiftRepository shiftRepository;
    private final WarehouseAccessGuard warehouseAccessGuard;
    private final StockMovementRepository stockMovementRepository;

    public boolean hasCapability(EntityCapability capability) {
        return switch (capability) {
            case STOCK_MOVEMENT_READ -> hasAnyRole(STOCK_READ_ROLES);
            case STOCK_MOVEMENT_CREATE -> hasAnyRole(STOCK_CREATE_ROLES);
            case STOCK_MOVEMENT_EXECUTE, STOCK_MOVEMENT_APPROVE -> hasAnyRole(STOCK_LIFECYCLE_ROLES);
            case SHIFT_CANCEL_DUE_TO_SICKNESS -> hasAnyRole(Set.of(
                    "WAREHOUSE_MANAGER", "DISPATCHER", "DRIVER", "WORKER"));
        };
    }

    public boolean canReadStockMovement(Long id) {
        return hasCapability(EntityCapability.STOCK_MOVEMENT_READ)
                && entityAccessValidator.canAccess(OperationalEntityType.STOCK_MOVEMENT, id);
    }

    public boolean canListStockMovements() {
        return hasCapability(EntityCapability.STOCK_MOVEMENT_READ);
    }

    public boolean canCreateStockMovement() {
        return hasCapability(EntityCapability.STOCK_MOVEMENT_CREATE);
    }

    public boolean canExecuteStockMovement(Long id) {
        return canManageStockMovement(id);
    }

    public boolean canApproveStockMovement(Long id) {
        return canManageStockMovement(id);
    }

    public boolean canCreateStockMovement(Long warehouseId) {
        if (authenticatedUserProvider.isCompanyAdmin() || authenticatedUserProvider.isOverlord()) return true;
        return authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                && warehouseAccessGuard.canMutateWarehouse(warehouseId);
    }

    public boolean canCreateStockTransfer(Long sourceWarehouseId, Long destinationWarehouseId) {
        return canCreateStockMovement(sourceWarehouseId);
    }

    private boolean canManageStockMovement(Long id) {
        if (id == null || !entityAccessValidator.canAccess(OperationalEntityType.STOCK_MOVEMENT, id)) return false;
        if (authenticatedUserProvider.isCompanyAdmin() || authenticatedUserProvider.isOverlord()) return true;
        StockMovement movement = stockMovementRepository.findByIdWithDetails(id).orElse(null);
        if (movement == null) return false;
        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return movement.getWarehouse() != null
                    && warehouseAccessGuard.canMutateWarehouse(movement.getWarehouse());
        }
        if (authenticatedUserProvider.hasRole("DISPATCHER")) {
            return movement.getTransportOrder() != null
                    || movement.getReferenceType() == rs.logistics.logistics_system.enums.StockMovementReferenceType.TRANSPORT_ORDER;
        }
        return false;
    }

    public boolean canCancelShiftDueToSickness(Long id) {
        if (!hasCapability(EntityCapability.SHIFT_CANCEL_DUE_TO_SICKNESS) || id == null) {
            return false;
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        return shiftRepository.findByIdAndEmployee_Company_Id(id, companyId)
                .map(this::canCancelShift)
                .orElse(false);
    }

    private boolean canCancelShift(Shift shift) {
        if (authenticatedUserProvider.hasRole("DRIVER") || authenticatedUserProvider.hasRole("WORKER")) {
            return shift.getEmployee() != null
                    && shift.getEmployee().getUser() != null
                    && authenticatedUserProvider.getAuthenticatedUserId()
                    .equals(shift.getEmployee().getUser().getId());
        }
        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            try {
                warehouseAccessGuard.ensureCanReadWarehouse(shift.getWarehouse());
                return true;
            } catch (RuntimeException denied) {
                return false;
            }
        }
        return authenticatedUserProvider.hasRole("DISPATCHER");
    }

    private boolean hasAnyRole(Set<String> roles) {
        return roles.stream().anyMatch(authenticatedUserProvider::hasRole);
    }
}
