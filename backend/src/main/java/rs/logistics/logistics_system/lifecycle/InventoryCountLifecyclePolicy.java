package rs.logistics.logistics_system.lifecycle;

import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class InventoryCountLifecyclePolicy {

    private InventoryCountLifecyclePolicy() {
    }

    public static LifecycleTransitionPolicy<InventoryCountSessionStatus> create(
            Map<InventoryCountSessionStatus, Set<InventoryCountSessionStatus>> transitions
    ) {
        return new LifecycleTransitionPolicy<>(
                LifecycleEntityType.INVENTORY_COUNT,
                InventoryCountSessionStatus.class,
                transitions,
                roleMatrix(),
                List.of(new TransitionReasonLifecycleHook<>())
        );
    }

    private static Map<InventoryCountSessionStatus, Set<String>> roleMatrix() {
        Map<InventoryCountSessionStatus, Set<String>> matrix = new EnumMap<>(InventoryCountSessionStatus.class);
        Set<String> managers = Set.of("OVERLORD", "WAREHOUSE_MANAGER");
        Set<String> counters = Set.of("OVERLORD", "WAREHOUSE_MANAGER", "WORKER");

        matrix.put(InventoryCountSessionStatus.DRAFT, managers);
        matrix.put(InventoryCountSessionStatus.OPEN, managers);
        matrix.put(InventoryCountSessionStatus.COUNTING, counters);
        matrix.put(InventoryCountSessionStatus.REVIEW, managers);
        matrix.put(InventoryCountSessionStatus.APPROVED, managers);
        matrix.put(InventoryCountSessionStatus.ADJUSTMENTS_CREATED, managers);
        matrix.put(InventoryCountSessionStatus.CLOSED, managers);
        matrix.put(InventoryCountSessionStatus.REJECTED, managers);
        matrix.put(InventoryCountSessionStatus.CANCELLED, managers);
        return matrix;
    }
}
