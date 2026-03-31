package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.VehicleMapper;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.VehicleServiceDefinition;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService implements VehicleServiceDefinition {

    private final VehicleRepository vehicleRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final AuditFacadeDefinition auditFacade;

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);

    @Transactional
    @Override
    public VehicleResponse create(VehicleCreate dto) {
        Vehicle vehicle = VehicleMapper.toEntity(dto);

        Vehicle saved = vehicleRepository.save(vehicle);

        auditFacade.recordCreate("VEHICLE", saved.getId());
        auditFacade.log(
                "CREATE",
                "VEHICLE",
                saved.getId(),
                "Vehicle created (ID: " + saved.getId() + ")"
        );

        return VehicleMapper.toResponse(saved);
    }

    @Transactional
    @Override
    public VehicleResponse update(Long id, VehicleUpdate dto) {
        Vehicle vehicle = findVehicleById(id);

        String oldRegistrationNumber = vehicle.getRegistrationNumber();
        String oldBrand = vehicle.getBrand();
        String oldModel = vehicle.getModel();
        BigDecimal oldCapacity = vehicle.getCapacity();

        VehicleMapper.updateEntity(vehicle, dto);
        Vehicle updated = vehicleRepository.save(vehicle);

        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "registrationNumber", oldRegistrationNumber, updated.getRegistrationNumber());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "brand", oldBrand, updated.getBrand());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "model", oldModel, updated.getModel());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "capacity", oldCapacity, updated.getCapacity());

        auditFacade.log(
                "UPDATE",
                "VEHICLE",
                updated.getId(),
                "Vehicle updated (ID: " + updated.getId() + ")"
        );

        return VehicleMapper.toResponse(updated);
    }

    @Override
    public VehicleResponse getById(Long id) {
        Vehicle vehicle = findVehicleById(id);
        return VehicleMapper.toResponse(vehicle);
    }

    @Override
    public List<VehicleResponse> getAll() {
        return vehicleRepository.findAll()
                .stream()
                .map(VehicleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void delete(Long id) {
        Vehicle vehicle = findVehicleById(id);

        if (hasActiveTransport(vehicle.getId())) {
            throw new BadRequestException("Vehicle cannot be deleted while it has an active transport order");
        }

        vehicleRepository.delete(vehicle);

        auditFacade.recordDelete("VEHICLE", id);
        auditFacade.log(
                "DELETE",
                "VEHICLE",
                id,
                "Vehicle deleted (ID: " + id + ")"
        );
    }

    @Transactional
    @Override
    public VehicleResponse changeStatus(Long id, VehicleStatus newStatus) {
        Vehicle vehicle = findVehicleById(id);
        VehicleStatus currentStatus = vehicle.getStatus();

        if (newStatus == null) {
            throw new BadRequestException("Vehicle status is required");
        }

        if (currentStatus == newStatus) {
            throw new BadRequestException("Vehicle already has selected status");
        }

        validateStatusTransition(currentStatus, newStatus);
        validateStatusChangeAgainstActiveTransport(vehicle, newStatus);

        vehicle.setStatus(newStatus);
        Vehicle updated = vehicleRepository.save(vehicle);

        auditFacade.recordStatusChange("VEHICLE", updated.getId(), "status", currentStatus, newStatus);
        auditFacade.log(
                "STATUS_CHANGED",
                "VEHICLE",
                updated.getId(),
                "Vehicle status changed from " + currentStatus + " to " + newStatus + " (ID: " + updated.getId() + ")"
        );

        return VehicleMapper.toResponse(updated);
    }

    // helpers

    private Vehicle findVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
    }

    private boolean hasActiveTransport(Long vehicleId) {
        return transportOrderRepository.existsByVehicleIdAndStatusIn(vehicleId, ACTIVE_TRANSPORT_STATUSES);
    }

    private void validateStatusTransition(VehicleStatus currentStatus, VehicleStatus newStatus) {
        switch (currentStatus) {
            case AVAILABLE:
                if (newStatus != VehicleStatus.IN_USE
                        && newStatus != VehicleStatus.MAINTENANCE
                        && newStatus != VehicleStatus.OUT_OF_SERVICE) {
                    throw new BadRequestException("Vehicle in AVAILABLE status cannot change to " + newStatus);
                }
                break;

            case IN_USE:
                if (newStatus != VehicleStatus.AVAILABLE) {
                    throw new BadRequestException("Vehicle in IN_USE status can only change to AVAILABLE");
                }
                break;

            case MAINTENANCE:
                if (newStatus != VehicleStatus.AVAILABLE
                        && newStatus != VehicleStatus.OUT_OF_SERVICE) {
                    throw new BadRequestException("Vehicle in MAINTENANCE status cannot change to " + newStatus);
                }
                break;

            case OUT_OF_SERVICE:
                if (newStatus != VehicleStatus.AVAILABLE
                        && newStatus != VehicleStatus.MAINTENANCE) {
                    throw new BadRequestException("Vehicle in OUT_OF_SERVICE status cannot change to " + newStatus);
                }
                break;

            default:
                throw new BadRequestException("Unsupported current vehicle status");
        }
    }

    private void validateStatusChangeAgainstActiveTransport(Vehicle vehicle, VehicleStatus newStatus) {
        boolean hasActiveTransport = hasActiveTransport(vehicle.getId());

        if (!hasActiveTransport) {
            return;
        }

        if (newStatus == VehicleStatus.MAINTENANCE
                || newStatus == VehicleStatus.OUT_OF_SERVICE
                || newStatus == VehicleStatus.AVAILABLE) {
            throw new BadRequestException("Vehicle with active transport must remain in IN_USE status");
        }
    }
}