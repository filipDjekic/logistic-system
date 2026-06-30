package rs.logistics.logistics_system.service.implementation;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.response.StatusCountResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.VehicleModel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionContext;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionEngine;
import rs.logistics.logistics_system.mapper.VehicleMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.VehicleMaintenanceRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.VehicleServiceDefinition;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;

@Service
@RequiredArgsConstructor
public class VehicleService implements VehicleServiceDefinition {

    private final VehicleRepository vehicleRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final CompanyRepository companyRepository;
    private final VehicleMaintenanceRepository vehicleMaintenanceRepository;
    private final VehicleCatalogService vehicleCatalogService;
    private final AuditFacadeDefinition auditFacade;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final LifecycleTransitionEngine lifecycleTransitionEngine;

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES =
            Arrays.asList(
                    TransportOrderStatus.ASSIGNED,
                    TransportOrderStatus.PICKING,
                    TransportOrderStatus.PACKING,
                    TransportOrderStatus.READY_FOR_LOADING,
                    TransportOrderStatus.LOADING,
                    TransportOrderStatus.IN_TRANSIT,
                    TransportOrderStatus.RETURNING,
                    TransportOrderStatus.RESCHEDULED
            );

    @Transactional
    @Override
    public VehicleResponse create(VehicleCreate dto) {
        Company targetCompany = resolveTargetCompany(dto.getCompanyId());
        validateUniqueRegistrationNumber(dto.getRegistrationNumber(), targetCompany.getId());
        if (dto.getStatus() == VehicleStatus.RESERVED || dto.getStatus() == VehicleStatus.IN_USE) {
            throw new BadRequestException("Vehicle cannot be created in RESERVED or IN_USE status");
        }

        VehicleModel vehicleModel = vehicleCatalogService.getRequiredModel(dto.getVehicleModelId());
        Vehicle vehicle = VehicleMapper.toEntity(dto, vehicleModel);
        vehicle.setCompany(targetCompany);

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

        validateUniqueRegistrationNumberForUpdate(id, dto.getRegistrationNumber(), vehicle.getCompany() != null ? vehicle.getCompany().getId() : null);

        String oldRegistrationNumber = vehicle.getRegistrationNumber();
        Long oldVehicleModelId = vehicle.getVehicleModel() != null ? vehicle.getVehicleModel().getId() : null;
        String oldBrand = vehicle.getBrand();
        String oldModel = vehicle.getModel();
        BigDecimal oldCapacity = vehicle.getCapacity();
        BigDecimal oldMaxWeight = vehicle.getMaxWeight();
        BigDecimal oldMaxVolume = vehicle.getMaxVolume();
        Integer oldMaxItems = vehicle.getMaxItems();
        Object oldStatus = vehicle.getStatus();

        if (dto.getStatus() != vehicle.getStatus()) {
            validateStatusTransition(vehicle.getStatus(), dto.getStatus());
            validateStatusChangeAgainstActiveTransport(vehicle, dto.getStatus());
            validateStatusChangeAgainstActiveMaintenance(vehicle, dto.getStatus());
        }

        VehicleModel vehicleModel = vehicleCatalogService.getRequiredModel(dto.getVehicleModelId());
        VehicleMapper.updateEntity(vehicle, dto, vehicleModel);
        Vehicle updated = vehicleRepository.save(vehicle);

        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "registrationNumber", oldRegistrationNumber, updated.getRegistrationNumber());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "vehicleModelId", oldVehicleModelId, updated.getVehicleModel() != null ? updated.getVehicleModel().getId() : null);
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "brand", oldBrand, updated.getBrand());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "model", oldModel, updated.getModel());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "capacity", oldCapacity, updated.getCapacity());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "maxWeight", oldMaxWeight, updated.getMaxWeight());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "maxVolume", oldMaxVolume, updated.getMaxVolume());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "maxItems", oldMaxItems, updated.getMaxItems());
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
        Vehicle vehicle = findVehicleById(id);
        validateDriverCanAccessVehicle(vehicle.getId());
        return VehicleMapper.toResponse(vehicle);
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
        Long driverUserId = authenticatedUserProvider.hasRole("DRIVER")
                ? authenticatedUserProvider.getAuthenticatedUserId()
                : null;

        return PageResponse.from(vehicleRepository.searchVehicles(
                companyId,
                driverUserId,
                QueryParameterNormalizer.trimToNull(search),
                status,
                QueryParameterNormalizer.trimToNull(type),
                available,
                capacityFrom,
                capacityTo,
                pageable
        ).map(VehicleMapper::toResponse));
    }


    @Override
    public List<StatusCountResponse> countByStatus(String search, String type, Boolean available, BigDecimal capacityFrom, BigDecimal capacityTo) {
        validateCapacityRange(capacityFrom, capacityTo);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        return vehicleRepository.countGroupedByStatusFiltered(
                        companyId,
                        QueryParameterNormalizer.trimToNull(search),
                        QueryParameterNormalizer.trimToNull(type),
                        available,
                        capacityFrom,
                        capacityTo
                )
                .stream()
                .map(row -> new StatusCountResponse(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                .toList();
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
    public VehicleResponse changeStatus(Long id, VehicleStatus newStatus, String reason, Long expectedVersion) {
        Vehicle vehicle = findVehicleById(id);
        VehicleStatus currentStatus = vehicle.getStatus();
        Boolean oldActive = vehicle.getActive();

        LifecycleTransitionContext<VehicleStatus> lifecycleContext = lifecycleTransitionEngine.validate(
                LifecycleEntityType.VEHICLE,
                vehicle.getId(),
                VehicleStatus.class,
                currentStatus,
                newStatus,
                reason,
                expectedVersion,
                vehicle.getVersion()
        );

        validateStatusChangeAgainstActiveTransport(vehicle, newStatus);
        validateStatusChangeAgainstActiveMaintenance(vehicle, newStatus);

        vehicle.setStatus(newStatus);
        vehicle.setActive(newStatus != VehicleStatus.OUT_OF_SERVICE);

        Vehicle updated = vehicleRepository.save(vehicle);

        auditFacade.recordStatusChange("VEHICLE", updated.getId(), "status", currentStatus, newStatus);
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "active", oldActive, updated.getActive());
        auditFacade.log(
                "STATUS_CHANGED",
                "VEHICLE",
                updated.getId(),
                "Vehicle status changed from " + currentStatus + " to " + newStatus + transitionReasonSuffix(reason) + " (ID: " + updated.getId() + ")"
        );
        lifecycleTransitionEngine.afterTransition(lifecycleContext, VehicleStatus.class);

        return VehicleMapper.toResponse(updated);
    }


    @Override
    public AllowedStatusTransitionsResponse allowedStatusTransitions(Long id) {
        Vehicle vehicle = findVehicleById(id);
        return new AllowedStatusTransitionsResponse(
                vehicle.getStatus().name(),
                lifecycleTransitionEngine.allowedStatusesForCurrentUser(LifecycleEntityType.VEHICLE, VehicleStatus.class, vehicle.getStatus()).stream().map(Enum::name).toList(),
                vehicle.getVersion()
        );
    }


    @Override
    @Transactional
    public VehicleResponse archiveVehicle(Long id) {
        return changeStatus(id, VehicleStatus.OUT_OF_SERVICE, "Archived", null);
    }

    @Override
    @Transactional
    public VehicleResponse restoreVehicle(Long id) {
        return changeStatus(id, VehicleStatus.AVAILABLE, "Restored", null);
    }

    private void validateDriverCanAccessVehicle(Long vehicleId) {
        if (!authenticatedUserProvider.hasRole("DRIVER")) {
            return;
        }

        boolean assignedInTransportHistory = vehicleRepository.existsVehicleAssignedToDriverHistory(
                vehicleId,
                authenticatedUserProvider.getAuthenticatedUserId()
        );

        if (!assignedInTransportHistory) {
            throw new ResourceNotFoundException("Vehicle not found");
        }
    }

    private String transitionReasonSuffix(String reason) {
        if (reason == null || reason.isBlank()) {
            return "";
        }
        return " with reason: " + reason.trim();
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

            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
            validateTargetCompany(company);
            return company;
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompanyOrThrow();
        validateTargetCompany(company);
        return company;
    }

    private void validateTargetCompany(Company company) {
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

    private boolean hasAnyTransportHistory(Long vehicleId) {
        return transportOrderRepository.existsByVehicleId(vehicleId);
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
