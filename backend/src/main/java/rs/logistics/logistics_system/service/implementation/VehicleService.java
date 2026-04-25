package rs.logistics.logistics_system.service.implementation;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.VehicleMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.VehicleServiceDefinition;

@Service
@RequiredArgsConstructor
public class VehicleService implements VehicleServiceDefinition {

    private final VehicleRepository vehicleRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final CompanyRepository companyRepository;
    private final AuditFacadeDefinition auditFacade;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES =
            Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);

    @Transactional
    @Override
    public VehicleResponse create(VehicleCreate dto) {
        validateUniqueRegistrationNumber(dto.getRegistrationNumber());

        Vehicle vehicle = VehicleMapper.toEntity(dto);
        vehicle.setCompany(resolveTargetCompany(dto.getCompanyId()));

        Vehicle saved = vehicleRepository.save(vehicle);

        auditFacade.recordCreate("VEHICLE", saved.getId());
        auditFacade.recordFieldChange("VEHICLE", saved.getId(), "company_id", null, saved.getCompany() != null ? saved.getCompany().getId() : null);
        auditFacade.log(
                "CREATE",
                "VEHICLE",
                saved.getId(),
                "Vehicle created (ID: " + saved.getId() + ", companyId: " + (saved.getCompany() != null ? saved.getCompany().getId() : null) + ")"
        );

        return VehicleMapper.toResponse(saved);
    }

    @Transactional
    @Override
    public VehicleResponse update(Long id, VehicleUpdate dto) {
        Vehicle vehicle = findVehicleById(id);

        validateUniqueRegistrationNumberForUpdate(id, dto.getRegistrationNumber());

        String oldRegistrationNumber = vehicle.getRegistrationNumber();
        String oldBrand = vehicle.getBrand();
        String oldModel = vehicle.getModel();
        BigDecimal oldCapacity = vehicle.getCapacity();
        Object oldStatus = vehicle.getStatus();

        VehicleMapper.updateEntity(vehicle, dto);
        Vehicle updated = vehicleRepository.save(vehicle);

        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "registrationNumber", oldRegistrationNumber, updated.getRegistrationNumber());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "brand", oldBrand, updated.getBrand());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "model", oldModel, updated.getModel());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "capacity", oldCapacity, updated.getCapacity());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "status", oldStatus, updated.getStatus());

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
        return VehicleMapper.toResponse(findVehicleById(id));
    }

    @Override
    public PageResponse<VehicleResponse> getAll(
            String search,
            VehicleStatus status,
            String type,
            Boolean available,
            BigDecimal capacityFrom,
            BigDecimal capacityTo,
            Pageable pageable
    ) {
        validateCapacityRange(capacityFrom, capacityTo);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        return PageResponse.from(vehicleRepository.searchVehicles(
                companyId,
                normalizeSearch(search),
                status,
                normalizeSearch(type),
                available,
                capacityFrom,
                capacityTo,
                pageable
        ).map(VehicleMapper::toResponse));
    }

    @Transactional
    @Override
    public void delete(Long id) {
        Vehicle vehicle = findVehicleById(id);

        if (hasActiveTransport(vehicle.getId())) {
            throw new BadRequestException("Vehicle cannot be deleted because it is assigned to an active transport. Change vehicle status instead.");
        }

        if (hasAnyTransportHistory(vehicle.getId())) {
            throw new BadRequestException("Vehicle cannot be deleted because it has transport history. Use OUT_OF_SERVICE or another status change instead.");
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

    @Override
    @Transactional
    public VehicleResponse changeStatus(Long id, VehicleStatus newStatus) {
        Vehicle vehicle = findVehicleById(id);
        VehicleStatus currentStatus = vehicle.getStatus();
        Boolean oldActive = vehicle.getActive();

        if (newStatus == null) {
            throw new BadRequestException("Vehicle status is required");
        }

        if (currentStatus == newStatus) {
            throw new BadRequestException("Vehicle already has selected status");
        }

        validateStatusTransition(currentStatus, newStatus);
        validateStatusChangeAgainstActiveTransport(vehicle, newStatus);

        vehicle.setStatus(newStatus);
        vehicle.setActive(newStatus != VehicleStatus.OUT_OF_SERVICE);

        Vehicle updated = vehicleRepository.save(vehicle);

        auditFacade.recordStatusChange("VEHICLE", updated.getId(), "status", currentStatus, newStatus);
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "active", oldActive, updated.getActive());
        auditFacade.log(
                "STATUS_CHANGED",
                "VEHICLE",
                updated.getId(),
                "Vehicle status changed from " + currentStatus + " to " + newStatus + " (ID: " + updated.getId() + ")"
        );

        return VehicleMapper.toResponse(updated);
    }

    private Vehicle findVehicleById(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return vehicleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        }

        return vehicleRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
    }

    private Company resolveTargetCompany(Long companyId) {
        if (authenticatedUserProvider.isOverlord()) {
            if (companyId == null) {
                throw new BadRequestException("companyId is required for OVERLORD vehicle creation");
            }

            return companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompany();
        if (company == null) {
            throw new ForbiddenException("Authenticated user is not assigned to a company");
        }

        return company;
    }

    private boolean hasActiveTransport(Long vehicleId) {
        return transportOrderRepository.existsByVehicleIdAndStatusIn(vehicleId, ACTIVE_TRANSPORT_STATUSES);
    }

    private boolean hasAnyTransportHistory(Long vehicleId) {
        return transportOrderRepository.existsByVehicleId(vehicleId);
    }

    private void validateStatusTransition(VehicleStatus currentStatus, VehicleStatus newStatus) {
        switch (currentStatus) {
            case AVAILABLE -> {
                if (newStatus != VehicleStatus.IN_USE
                        && newStatus != VehicleStatus.MAINTENANCE
                        && newStatus != VehicleStatus.OUT_OF_SERVICE) {
                    throw new BadRequestException("Vehicle in AVAILABLE status cannot change to " + newStatus);
                }
            }
            case IN_USE -> {
                if (newStatus != VehicleStatus.AVAILABLE) {
                    throw new BadRequestException("Vehicle in IN_USE status can only change to AVAILABLE");
                }
            }
            case MAINTENANCE -> {
                if (newStatus != VehicleStatus.AVAILABLE && newStatus != VehicleStatus.OUT_OF_SERVICE) {
                    throw new BadRequestException("Vehicle in MAINTENANCE status cannot change to " + newStatus);
                }
            }
            case OUT_OF_SERVICE -> {
                if (newStatus != VehicleStatus.AVAILABLE && newStatus != VehicleStatus.MAINTENANCE) {
                    throw new BadRequestException("Vehicle in OUT_OF_SERVICE status cannot change to " + newStatus);
                }
            }
            default -> throw new BadRequestException("Unsupported current vehicle status");
        }
    }

    private void validateStatusChangeAgainstActiveTransport(Vehicle vehicle, VehicleStatus newStatus) {
        boolean hasActiveTransport = hasActiveTransport(vehicle.getId());

        if (newStatus == VehicleStatus.IN_USE && !hasActiveTransport) {
            throw new BadRequestException("Vehicle can be set to IN_USE only when it has an active transport order");
        }

        if (hasActiveTransport && newStatus != VehicleStatus.IN_USE) {
            throw new BadRequestException("Vehicle with active transport must remain in IN_USE status");
        }
    }

    private String normalizeSearch(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void validateCapacityRange(BigDecimal capacityFrom, BigDecimal capacityTo) {
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

    private void validateUniqueRegistrationNumber(String registrationNumber) {
        if (vehicleRepository.existsByRegistrationNumberIgnoreCase(registrationNumber)) {
            throw new BadRequestException("Vehicle registration number already exists");
        }
    }

    private void validateUniqueRegistrationNumberForUpdate(Long id, String registrationNumber) {
        if (vehicleRepository.existsByRegistrationNumberIgnoreCaseAndIdNot(registrationNumber, id)) {
            throw new BadRequestException("Vehicle registration number already exists");
        }
    }

    private boolean containsIgnoreCase(String source, String search) {
        return source != null && source.toLowerCase().contains(search.toLowerCase());
    }
}