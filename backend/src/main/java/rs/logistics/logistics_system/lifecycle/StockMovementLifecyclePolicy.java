package rs.logistics.logistics_system.lifecycle;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import rs.logistics.logistics_system.enums.StockMovementStatus;

public final class StockMovementLifecyclePolicy {

    private StockMovementLifecyclePolicy() {
    }

    public static LifecycleTransitionPolicy<StockMovementStatus> create(
            Map<StockMovementStatus, Set<StockMovementStatus>> transitions
    ) {
        return new LifecycleTransitionPolicy<>(
                LifecycleEntityType.STOCK_MOVEMENT,
                StockMovementStatus.class,
                transitions,
                roleMatrix(),
                List.of(new TransitionReasonLifecycleHook<>())
        );
    }

    private static Map<StockMovementStatus, Set<String>> roleMatrix() {
        Map<StockMovementStatus, Set<String>> matrix = new EnumMap<>(StockMovementStatus.class);

        Set<String> warehouseOperators = Set.of(
                "OVERLORD",
                "COMPANY_ADMIN",
                "WAREHOUSE_MANAGER",
                "DISPATCHER",
                "WORKER"
        );
        Set<String> approvers = Set.of(
                "OVERLORD",
                "COMPANY_ADMIN",
                "WAREHOUSE_MANAGER"
        );
        Set<String> reversalOperators = Set.of(
                "OVERLORD",
                "COMPANY_ADMIN",
                "WAREHOUSE_MANAGER",
                "DISPATCHER"
        );

        matrix.put(StockMovementStatus.DRAFT, warehouseOperators);
        matrix.put(StockMovementStatus.PENDING_APPROVAL, warehouseOperators);
        matrix.put(StockMovementStatus.APPROVED, approvers);
        matrix.put(StockMovementStatus.EXECUTED, warehouseOperators);
        matrix.put(StockMovementStatus.REJECTED, approvers);
        matrix.put(StockMovementStatus.CANCELLED, warehouseOperators);
        matrix.put(StockMovementStatus.REVERSED, reversalOperators);

        return matrix;
    }
}
