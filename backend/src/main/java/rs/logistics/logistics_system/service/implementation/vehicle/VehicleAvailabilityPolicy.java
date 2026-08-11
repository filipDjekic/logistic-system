package rs.logistics.logistics_system.service.implementation.vehicle;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.lifecycle.LifecycleStatusClassifier;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleMaintenanceRepository;

@Component
@RequiredArgsConstructor
public class VehicleAvailabilityPolicy {

    private final TransportOrderRepository transportOrderRepository;
    private final VehicleMaintenanceRepository maintenanceRepository;
    private final LifecycleStatusClassifier lifecycleStatusClassifier;

    public VehicleStatus reconcileStatus(Long vehicleId, VehicleStatus currentStatus) {
        if (maintenanceRepository.existsByVehicleIdAndStatus(vehicleId, VehicleMaintenanceStatus.IN_PROGRESS)) {
            return VehicleStatus.MAINTENANCE;
        }
        if (transportOrderRepository.existsByVehicleIdAndStatusIn(
                vehicleId,
                lifecycleStatusClassifier.vehicleInUseTransportStatuses()
        )) {
            return VehicleStatus.IN_USE;
        }
        if (transportOrderRepository.existsByVehicleIdAndStatusIn(
                vehicleId,
                lifecycleStatusClassifier.vehicleReservedTransportStatuses()
        )) {
            return VehicleStatus.RESERVED;
        }
        if (currentStatus == VehicleStatus.RESERVED
                || currentStatus == VehicleStatus.IN_USE
                || currentStatus == VehicleStatus.MAINTENANCE) {
            return VehicleStatus.AVAILABLE;
        }
        return currentStatus;
    }
}
