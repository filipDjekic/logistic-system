package rs.logistics.logistics_system.service.implementation.vehicle;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionEngine;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleMaintenanceRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;

@Component
@RequiredArgsConstructor
public class VehiclePolicy {

    private final VehicleRepository vehicleRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final VehicleMaintenanceRepository vehicleMaintenanceRepository;
    private final LifecycleTransitionEngine lifecycleTransitionEngine;

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = Arrays.asList(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING,
            TransportOrderStatus.RESCHEDULED
    );

    public void validateCreate(String registrationNumber, VehicleStatus status, Company targetCompany) {
        validateTargetCompany(targetCompany);
        validateUniqueRegistrationNumber(registrationNumber, targetCompany.getId());
        if (status == VehicleStatus.RESERVED || status == VehicleStatus.IN_USE) {
            throw new BadRequestException("Vehicle cannot be created in RESERVED or IN_USE status");
        }
    }

    public void validateUpdate(Vehicle vehicle, String registrationNumber, VehicleStatus newStatus) {
        validateUniqueRegistrationNumberForUpdate(
                vehicle.getId(),
                registrationNumber,
                vehicle.getCompany() != null ? vehicle.getCompany().getId() : null
        );

        if (newStatus != vehicle.getStatus()) {
            validateStatusTransition(vehicle.getStatus(), newStatus);
            validateStatusChangeAgainstActiveTransport(vehicle, newStatus);
            validateStatusChangeAgainstActiveMaintenance(vehicle, newStatus);
        }
    }

    public void validateDelete(Vehicle vehicle) {
        if (hasActiveTransport(vehicle.getId())) {
            throw new BadRequestException("Vehicle cannot be deleted because it is assigned to an active transport. Change vehicle status instead.");
        }

        if (transportOrderRepository.existsByVehicleId(vehicle.getId())) {
            throw new BadRequestException("Vehicle cannot be deleted because it has transport history. Use OUT_OF_SERVICE or another status change instead.");
        }
    }

    public void validateStatusChange(Vehicle vehicle, VehicleStatus newStatus) {
        validateStatusChangeAgainstActiveTransport(vehicle, newStatus);
        validateStatusChangeAgainstActiveMaintenance(vehicle, newStatus);
    }

    public void validateCapacityRange(BigDecimal capacityFrom, BigDecimal capacityTo) {
        if (capacityFrom != null && capacityFrom.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("capacityFrom cannot be negative");
        }

        if (capacityTo != null && capacityTo.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("capacityTo cannot be negative");
        }

        if (capacityFrom != null && capacityTo != null && capacityFrom.compareTo(capacityTo) > 0) {
            throw new BadRequestException("capacityFrom cannot be greater than capacityTo");
        }
    }

    public void validateTargetCompany(Company company) {
        if (company == null || company.getId() == null) {
            throw new BadRequestException("Vehicle must belong to a company");
        }

        if (!Boolean.TRUE.equals(company.getActive())) {
            throw new BadRequestException("Vehicle cannot be created for an inactive company");
        }
    }

    private boolean hasActiveTransport(Long vehicleId) {
        return transportOrderRepository.existsByVehicleIdAndStatusIn(vehicleId, ACTIVE_TRANSPORT_STATUSES);
    }

    private void validateStatusTransition(VehicleStatus currentStatus, VehicleStatus newStatus) {
        lifecycleTransitionEngine.requireTransitionAllowed(
                LifecycleEntityType.VEHICLE,
                VehicleStatus.class,
                currentStatus,
                newStatus,
                "Vehicle status cannot be changed from " + currentStatus + " to " + newStatus
        );
    }

    private void validateStatusChangeAgainstActiveTransport(Vehicle vehicle, VehicleStatus newStatus) {
        boolean hasActiveTransport = hasActiveTransport(vehicle.getId());

        if ((newStatus == VehicleStatus.RESERVED || newStatus == VehicleStatus.IN_USE) && !hasActiveTransport) {
            throw new BadRequestException("Vehicle can be set to RESERVED or IN_USE only through an active transport order");
        }

        if (hasActiveTransport && newStatus != VehicleStatus.RESERVED && newStatus != VehicleStatus.IN_USE) {
            throw new BadRequestException("Vehicle with active transport must remain RESERVED or IN_USE");
        }
    }

    private void validateStatusChangeAgainstActiveMaintenance(Vehicle vehicle, VehicleStatus newStatus) {
        boolean hasActiveMaintenance = vehicleMaintenanceRepository.existsByVehicleIdAndStatusIn(
                vehicle.getId(),
                List.of(VehicleMaintenanceStatus.PLANNED, VehicleMaintenanceStatus.IN_PROGRESS)
        );

        if (hasActiveMaintenance && newStatus != VehicleStatus.MAINTENANCE && newStatus != VehicleStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("Vehicle with active maintenance must remain in MAINTENANCE or OUT_OF_SERVICE status");
        }
    }

    private void validateUniqueRegistrationNumber(String registrationNumber, Long companyId) {
        if (vehicleRepository.existsByRegistrationNumberIgnoreCaseAndCompany_Id(registrationNumber, companyId)) {
            throw new BadRequestException("Vehicle registration number already exists in this company");
        }
    }

    private void validateUniqueRegistrationNumberForUpdate(Long id, String registrationNumber, Long companyId) {
        if (vehicleRepository.existsByRegistrationNumberIgnoreCaseAndCompany_IdAndIdNot(registrationNumber, companyId, id)) {
            throw new BadRequestException("Vehicle registration number already exists in this company");
        }
    }
}
