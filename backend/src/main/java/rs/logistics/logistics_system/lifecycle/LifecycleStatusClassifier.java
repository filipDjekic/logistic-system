package rs.logistics.logistics_system.lifecycle;

import java.util.Set;

import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.enums.TransportOrderStatus;

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

    public boolean isTerminalTransportStatus(TransportOrderStatus status) {
        return status != null && TRANSPORT_TERMINAL_STATUSES.contains(status);
    }

    public boolean isPreDispatchTransportStatus(TransportOrderStatus status) {
        return status != null && TRANSPORT_PRE_DISPATCH_STATUSES.contains(status);
    }

    public boolean isActiveTransportStatus(TransportOrderStatus status) {
        return status != null && !isTerminalTransportStatus(status) && status != TransportOrderStatus.DRAFT;
    }
}
