package rs.logistics.logistics_system.enums;

import java.util.List;

public enum TransportOrderStatus {
    DRAFT,
    CREATED,
    ASSIGNED,
    PICKING,
    PACKING,
    READY_FOR_LOADING,
    LOADING,
    IN_TRANSIT,
    DELIVERED,
    FAILED,
    RETURNING,
    RESCHEDULED,
    CANCELLED;

    public boolean isTerminal() {
        return this == DELIVERED || this == FAILED || this == CANCELLED;
    }

    public boolean isBeforeDispatch() {
        return this == DRAFT
                || this == CREATED
                || this == ASSIGNED
                || this == PICKING
                || this == PACKING
                || this == READY_FOR_LOADING
                || this == LOADING
                || this == RESCHEDULED;
    }

    public boolean reservesVehicle() {
        return this == ASSIGNED
                || this == PICKING
                || this == PACKING
                || this == READY_FOR_LOADING
                || this == LOADING
                || this == RESCHEDULED;
    }

    public boolean usesVehicle() {
        return this == IN_TRANSIT || this == RETURNING;
    }

    public List<TransportOrderStatus> defaultNextStatuses() {
        return switch (this) {
            case DRAFT, CREATED -> List.of(ASSIGNED, CANCELLED);
            case ASSIGNED -> List.of(PICKING, CANCELLED);
            case PICKING -> List.of(PACKING, CANCELLED);
            case PACKING -> List.of(READY_FOR_LOADING, CANCELLED);
            case READY_FOR_LOADING -> List.of(LOADING, CANCELLED);
            case LOADING -> List.of(IN_TRANSIT, CANCELLED);
            case IN_TRANSIT -> List.of(DELIVERED, RETURNING, FAILED);
            case RETURNING -> List.of(FAILED);
            case RESCHEDULED -> List.of(ASSIGNED, CANCELLED);
            case DELIVERED, FAILED, CANCELLED -> List.of();
        };
    }
}
