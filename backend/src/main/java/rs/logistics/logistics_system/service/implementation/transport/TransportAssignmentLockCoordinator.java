package rs.logistics.logistics_system.service.implementation.transport;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

@Component
@RequiredArgsConstructor
public class TransportAssignmentLockCoordinator {

    private final VehicleRepository vehicleRepository;
    private final EmployeeRepository employeeRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public LockedAssignment lockAssignment(
            Collection<Long> vehicleIds,
            Long selectedVehicleId,
            Collection<Long> driverIds,
            Long selectedDriverId
    ) {
        Map<Long, Vehicle> vehicles = new LinkedHashMap<>();
        normalizedIds(vehicleIds).forEach(id -> vehicles.put(id, lockVehicle(id)));

        Map<Long, Employee> drivers = new LinkedHashMap<>();
        normalizedIds(driverIds).forEach(id -> drivers.put(id, lockDriver(id)));

        Vehicle selectedVehicle = vehicles.get(selectedVehicleId);
        Employee selectedDriver = drivers.get(selectedDriverId);
        if (selectedVehicle == null) {
            throw new ResourceNotFoundException("Vehicle not found");
        }
        if (selectedDriver == null) {
            throw new ResourceNotFoundException("Assigned employee not found");
        }
        return new LockedAssignment(selectedVehicle, selectedDriver);
    }

    private Vehicle lockVehicle(Long id) {
        return authenticatedUserProvider.isOverlord()
                ? vehicleRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"))
                : vehicleRepository.findByIdAndCompanyIdForUpdate(
                        id,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
    }

    private Employee lockDriver(Long id) {
        return authenticatedUserProvider.isOverlord()
                ? employeeRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"))
                : employeeRepository.findByIdAndCompanyIdForUpdate(
                        id,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));
    }

    private java.util.List<Long> normalizedIds(Collection<Long> ids) {
        return ids == null ? java.util.List.of() : ids.stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
    }

    public record LockedAssignment(Vehicle vehicle, Employee driver) {
    }
}
