package rs.logistics.logistics_system.security;

import org.junit.jupiter.api.Test;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.lifecycle.InventoryCountLifecyclePolicy;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecyclePolicyRegistry;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionPolicy;
import rs.logistics.logistics_system.lifecycle.ShiftLifecyclePolicy;
import rs.logistics.logistics_system.lifecycle.StockMovementLifecyclePolicy;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LifecycleAuthorizationContractTest {

    @Test
    void transportLifecycleRolesMatchDispatcherDriverWarehouseResponsibilities() {
        LifecycleTransitionPolicy<TransportOrderStatus> policy = registry().getPolicy(
                LifecycleEntityType.TRANSPORT_ORDER,
                TransportOrderStatus.class
        );

        assertAllowed(policy, TransportOrderStatus.ASSIGNED, "OVERLORD", "COMPANY_ADMIN", "DISPATCHER");
        assertAllowed(policy, TransportOrderStatus.LOADING, "WAREHOUSE_MANAGER", "DRIVER");
        assertAllowed(policy, TransportOrderStatus.IN_TRANSIT, "DRIVER", "DISPATCHER");
        assertNotAllowed(policy, TransportOrderStatus.CANCELLED, "DRIVER", "WORKER", "WAREHOUSE_MANAGER");
    }

    @Test
    void taskLifecycleAllowsAssignedExecutionButKeepsCancelWithManagers() {
        LifecycleTransitionPolicy<TaskStatus> policy = registry().getPolicy(LifecycleEntityType.TASK, TaskStatus.class);

        assertAllowed(policy, TaskStatus.ASSIGNED, "OVERLORD", "COMPANY_ADMIN", "WAREHOUSE_MANAGER", "DISPATCHER");
        assertAllowed(policy, TaskStatus.IN_PROGRESS, "DRIVER", "WORKER");
        assertAllowed(policy, TaskStatus.COMPLETED, "DRIVER", "WORKER");
        assertNotAllowed(policy, TaskStatus.CANCELLED, "DRIVER", "WORKER", "HR_MANAGER");
    }

    @Test
    void inventoryCountLifecycleLimitsWorkerToCounting() {
        LifecycleTransitionPolicy<InventoryCountSessionStatus> policy = InventoryCountLifecyclePolicy.create(inventoryCountTransitions());

        assertAllowed(policy, InventoryCountSessionStatus.COUNTING, "WORKER", "WAREHOUSE_MANAGER");
        assertNotAllowed(policy, InventoryCountSessionStatus.REVIEW, "WORKER", "DRIVER", "DISPATCHER");
        assertNotAllowed(policy, InventoryCountSessionStatus.APPROVED, "WORKER", "COMPANY_ADMIN");
        assertAllowed(policy, InventoryCountSessionStatus.CLOSED, "OVERLORD", "WAREHOUSE_MANAGER");
    }

    @Test
    void stockMovementLifecycleIsWarehouseManagerOnlyOutsideOverlord() {
        LifecycleTransitionPolicy<StockMovementStatus> policy = StockMovementLifecyclePolicy.create(stockMovementTransitions());

        assertAllowed(policy, StockMovementStatus.APPROVED, "OVERLORD", "WAREHOUSE_MANAGER");
        assertAllowed(policy, StockMovementStatus.EXECUTED, "OVERLORD", "WAREHOUSE_MANAGER");
        assertAllowed(policy, StockMovementStatus.REVERSED, "OVERLORD", "WAREHOUSE_MANAGER");
        assertNotAllowed(policy, StockMovementStatus.EXECUTED, "DISPATCHER", "WORKER", "DRIVER", "COMPANY_ADMIN");
    }

    @Test
    void vehicleLifecycleIsFleetAdminOnly() {
        LifecycleTransitionPolicy<VehicleStatus> policy = registry().getPolicy(LifecycleEntityType.VEHICLE, VehicleStatus.class);

        assertAllowed(policy, VehicleStatus.AVAILABLE, "OVERLORD", "COMPANY_ADMIN");
        assertAllowed(policy, VehicleStatus.MAINTENANCE, "OVERLORD", "COMPANY_ADMIN");
        assertNotAllowed(policy, VehicleStatus.MAINTENANCE, "DISPATCHER", "DRIVER", "WORKER", "WAREHOUSE_MANAGER");
    }

    @Test
    void shiftLifecycleIsHrManagedAndRuntimeStateChangesAreSystemOnly() {
        LifecycleTransitionPolicy<ShiftStatus> policy = ShiftLifecyclePolicy.create(shiftTransitions());

        assertAllowed(policy, ShiftStatus.CANCELLED, "OVERLORD", "HR_MANAGER");
        assertAllowed(policy, ShiftStatus.ACTIVE, "SYSTEM");
        assertAllowed(policy, ShiftStatus.FINISHED, "SYSTEM");
        assertNotAllowed(policy, ShiftStatus.CANCELLED, "COMPANY_ADMIN", "DISPATCHER", "WAREHOUSE_MANAGER", "DRIVER", "WORKER");
    }

    private static LifecyclePolicyRegistry registry() {
        return new LifecyclePolicyRegistry(new AppProperties());
    }

    private static <S extends Enum<S>> void assertAllowed(LifecycleTransitionPolicy<S> policy, S targetStatus, String... roles) {
        for (String role : roles) {
            assertTrue(policy.allowedRoles(targetStatus).contains(role), targetStatus + " must allow " + role);
        }
    }

    private static <S extends Enum<S>> void assertNotAllowed(LifecycleTransitionPolicy<S> policy, S targetStatus, String... roles) {
        for (String role : roles) {
            assertFalse(policy.allowedRoles(targetStatus).contains(role), targetStatus + " must not allow " + role);
        }
    }

    private static Map<InventoryCountSessionStatus, Set<InventoryCountSessionStatus>> inventoryCountTransitions() {
        Map<InventoryCountSessionStatus, Set<InventoryCountSessionStatus>> transitions = new LinkedHashMap<>();
        transitions.put(InventoryCountSessionStatus.DRAFT, ordered(InventoryCountSessionStatus.OPEN, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.OPEN, ordered(InventoryCountSessionStatus.COUNTING, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.COUNTING, ordered(InventoryCountSessionStatus.REVIEW, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.REVIEW, ordered(InventoryCountSessionStatus.APPROVED, InventoryCountSessionStatus.REJECTED, InventoryCountSessionStatus.COUNTING, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.APPROVED, ordered(InventoryCountSessionStatus.ADJUSTMENTS_CREATED, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.ADJUSTMENTS_CREATED, ordered(InventoryCountSessionStatus.CLOSED));
        transitions.put(InventoryCountSessionStatus.CLOSED, Set.of());
        transitions.put(InventoryCountSessionStatus.REJECTED, Set.of());
        transitions.put(InventoryCountSessionStatus.CANCELLED, Set.of());
        return transitions;
    }

    private static Map<StockMovementStatus, Set<StockMovementStatus>> stockMovementTransitions() {
        Map<StockMovementStatus, Set<StockMovementStatus>> transitions = new LinkedHashMap<>();
        transitions.put(StockMovementStatus.DRAFT, ordered(StockMovementStatus.PENDING_APPROVAL, StockMovementStatus.CANCELLED));
        transitions.put(StockMovementStatus.PENDING_APPROVAL, ordered(StockMovementStatus.APPROVED, StockMovementStatus.REJECTED, StockMovementStatus.CANCELLED));
        transitions.put(StockMovementStatus.APPROVED, ordered(StockMovementStatus.EXECUTED, StockMovementStatus.CANCELLED));
        transitions.put(StockMovementStatus.EXECUTED, ordered(StockMovementStatus.REVERSED));
        transitions.put(StockMovementStatus.REJECTED, Set.of());
        transitions.put(StockMovementStatus.CANCELLED, Set.of());
        transitions.put(StockMovementStatus.REVERSED, Set.of());
        return transitions;
    }

    private static Map<ShiftStatus, Set<ShiftStatus>> shiftTransitions() {
        Map<ShiftStatus, Set<ShiftStatus>> transitions = new LinkedHashMap<>();
        transitions.put(ShiftStatus.PLANNED, ordered(ShiftStatus.ACTIVE, ShiftStatus.CANCELLED));
        transitions.put(ShiftStatus.ACTIVE, ordered(ShiftStatus.FINISHED, ShiftStatus.CANCELLED));
        transitions.put(ShiftStatus.FINISHED, Set.of());
        transitions.put(ShiftStatus.CANCELLED, Set.of());
        return transitions;
    }

    @SafeVarargs
    private static <S extends Enum<S>> Set<S> ordered(S... values) {
        return new LinkedHashSet<>(List.of(values));
    }
}
