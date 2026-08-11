package rs.logistics.logistics_system.lifecycle;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;

@Component
public class LifecycleStatusClassifier {

    private static final Set<TransportOrderStatus> TRANSPORT_TERMINAL_STATUSES = Set.of(
            TransportOrderStatus.DELIVERED,
            TransportOrderStatus.FAILED,
            TransportOrderStatus.CANCELLED
    );

    private static final Set<TransportOrderStatus> TRANSPORT_PRE_DISPATCH_STATUSES = Set.of(
            TransportOrderStatus.DRAFT,
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.RESCHEDULED
    );

    private static final Set<TransportOrderStatus> TRANSPORT_VEHICLE_RESERVED_STATUSES = immutableEnumSet(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.RESCHEDULED
    );

    private static final Set<TransportOrderStatus> TRANSPORT_VEHICLE_IN_USE_STATUSES = immutableEnumSet(
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING
    );

    private static final Set<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = immutableEnumSet(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING,
            TransportOrderStatus.RESCHEDULED
    );

    private static final Set<TaskStatus> ACTIVE_TASK_STATUSES = immutableEnumSet(
            TaskStatus.NEW,
            TaskStatus.OPEN,
            TaskStatus.ASSIGNED,
            TaskStatus.IN_PROGRESS,
            TaskStatus.BLOCKED
    );

    private static final Set<VehicleMaintenanceStatus> ACTIVE_VEHICLE_MAINTENANCE_STATUSES = immutableEnumSet(
            VehicleMaintenanceStatus.PLANNED,
            VehicleMaintenanceStatus.IN_PROGRESS
    );

    private static final Set<InventoryCountSessionStatus> INVENTORY_COUNT_STOCK_BLOCKING_STATUSES = immutableEnumSet(
            InventoryCountSessionStatus.OPEN,
            InventoryCountSessionStatus.COUNTING,
            InventoryCountSessionStatus.REVIEW,
            InventoryCountSessionStatus.APPROVED
    );

    private static final Set<StockMovementStatus> STOCK_MOVEMENT_TERMINAL_STATUSES = Set.of(
            StockMovementStatus.REJECTED,
            StockMovementStatus.CANCELLED,
            StockMovementStatus.REVERSED
    );

    private static final Set<StockMovementStatus> STOCK_MOVEMENT_LOCKED_STATUSES = Set.of(
            StockMovementStatus.EXECUTED,
            StockMovementStatus.REVERSED
    );

    public boolean isTerminalTransportStatus(TransportOrderStatus status) {
        return status != null && TRANSPORT_TERMINAL_STATUSES.contains(status);
    }

    public boolean isPreDispatchTransportStatus(TransportOrderStatus status) {
        return status != null && TRANSPORT_PRE_DISPATCH_STATUSES.contains(status);
    }

    public boolean isActiveTransportStatus(TransportOrderStatus status) {
        return status != null && ACTIVE_TRANSPORT_STATUSES.contains(status);
    }

    public boolean reservesVehicle(TransportOrderStatus status) {
        return status != null && TRANSPORT_VEHICLE_RESERVED_STATUSES.contains(status);
    }

    public boolean vehicleIsInUse(TransportOrderStatus status) {
        return status != null && TRANSPORT_VEHICLE_IN_USE_STATUSES.contains(status);
    }

    public Set<TransportOrderStatus> activeTransportStatuses() {
        return ACTIVE_TRANSPORT_STATUSES;
    }

    public Set<TransportOrderStatus> scheduleBlockingTransportStatuses() {
        return ACTIVE_TRANSPORT_STATUSES;
    }

    public Set<TransportOrderStatus> vehicleReservedTransportStatuses() {
        return TRANSPORT_VEHICLE_RESERVED_STATUSES;
    }

    public Set<TransportOrderStatus> vehicleInUseTransportStatuses() {
        return TRANSPORT_VEHICLE_IN_USE_STATUSES;
    }

    public Set<TaskStatus> activeTaskStatuses() {
        return ACTIVE_TASK_STATUSES;
    }

    public Set<VehicleMaintenanceStatus> activeVehicleMaintenanceStatuses() {
        return ACTIVE_VEHICLE_MAINTENANCE_STATUSES;
    }

    public Set<InventoryCountSessionStatus> stockBlockingInventoryCountStatuses() {
        return INVENTORY_COUNT_STOCK_BLOCKING_STATUSES;
    }

    public boolean isTerminalStockMovementStatus(StockMovementStatus status) {
        return status != null && STOCK_MOVEMENT_TERMINAL_STATUSES.contains(status);
    }

    public boolean isLockedStockMovementStatus(StockMovementStatus status) {
        return status != null && STOCK_MOVEMENT_LOCKED_STATUSES.contains(status);
    }

    public boolean isPendingStockMovementStatus(StockMovementStatus status) {
        return status == StockMovementStatus.DRAFT
                || status == StockMovementStatus.PENDING_APPROVAL
                || status == StockMovementStatus.APPROVED;
    }

    @SafeVarargs
    private static <S extends Enum<S>> Set<S> immutableEnumSet(S first, S... rest) {
        EnumSet<S> values = EnumSet.of(first, rest);
        return Collections.unmodifiableSet(values);
    }
}
