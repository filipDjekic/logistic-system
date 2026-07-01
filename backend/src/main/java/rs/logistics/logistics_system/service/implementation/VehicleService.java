package rs.logistics.logistics_system.service.implementation;
import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StatusCountResponse;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.VehicleModel;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionContext;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionEngine;
import rs.logistics.logistics_system.mapper.VehicleMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.VehicleServiceDefinition;
import rs.logistics.logistics_system.service.implementation.vehicle.VehicleAuditService;
import rs.logistics.logistics_system.service.implementation.vehicle.VehicleAuditService.VehicleSnapshot;
import rs.logistics.logistics_system.service.implementation.vehicle.VehiclePolicy;
import rs.logistics.logistics_system.service.support.OptimisticLockGuard;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;

@Service
@RequiredArgsConstructor
public class VehicleService implements VehicleServiceDefinition {

    private final VehicleRepository vehicleRepository;
    private final CompanyRepository companyRepository;
    private final VehicleCatalogService vehicleCatalogService;
    private final VehicleAuditService vehicleAuditService;
    private final VehiclePolicy vehiclePolicy;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final LifecycleTransitionEngine lifecycleTransitionEngine;

    @Transactional
    @Override
    public VehicleResponse create(VehicleCreate dto) {
        Company targetCompany = resolveTargetCompany(dto.getCompanyId());
        vehiclePolicy.validateCreate(dto.getRegistrationNumber(), dto.getStatus(), targetCompany);

        VehicleModel vehicleModel = vehicleCatalogService.getRequiredModel(dto.getVehicleModelId());
        Vehicle vehicle = VehicleMapper.toEntity(dto, vehicleModel);
        vehicle.setCompany(targetCompany);

        Vehicle saved = vehicleRepository.save(vehicle);
        vehicleAuditService.recordCreate(saved);

        return VehicleMapper.toResponse(saved);
    }

    @Transactional
    @Override
    public VehicleResponse update(Long id, VehicleUpdate dto) {
        Vehicle vehicle = findVehicleById(id);
        OptimisticLockGuard.requireExpectedVersion(dto.getExpectedVersion(), vehicle.getVersion(), "Vehicle");
        vehiclePolicy.validateUpdate(vehicle, dto.getRegistrationNumber(), dto.getStatus());

        VehicleSnapshot before = vehicleAuditService.snapshot(vehicle);
        VehicleModel vehicleModel = vehicleCatalogService.getRequiredModel(dto.getVehicleModelId());
        VehicleMapper.updateEntity(vehicle, dto, vehicleModel);

        Vehicle updated = vehicleRepository.save(vehicle);
        vehicleAuditService.recordUpdate(before, updated);

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
        vehiclePolicy.validateCapacityRange(capacityFrom, capacityTo);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Long driverUserId = authenticatedUserProvider.hasRole("DRIVER")
                ? authenticatedUserProvider.getAuthenticatedUserId()
                : null;

        String normalizedSearch = QueryParameterNormalizer.trimToNull(search);
        Long searchId = QueryParameterNormalizer.parseLongOrNull(normalizedSearch);
        Integer searchYear = QueryParameterNormalizer.parseIntegerOrNull(normalizedSearch);

        return PageResponse.from(vehicleRepository.searchVehicles(
                companyId,
                driverUserId,
                normalizedSearch,
                searchId,
                searchYear,
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
        vehiclePolicy.validateCapacityRange(capacityFrom, capacityTo);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        return vehicleRepository.countGroupedByStatusFiltered(
                        companyId,
                        QueryParameterNormalizer.trimToNull(search),
                        QueryParameterNormalizer.parseLongOrNull(search),
                        QueryParameterNormalizer.parseIntegerOrNull(search),
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
        vehiclePolicy.validateDelete(vehicle);

        vehicleRepository.delete(vehicle);
        vehicleAuditService.recordDelete(id);
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

        vehiclePolicy.validateStatusChange(vehicle, newStatus);

        vehicle.setStatus(newStatus);
        vehicle.setActive(newStatus != VehicleStatus.OUT_OF_SERVICE);

        Vehicle updated = vehicleRepository.save(vehicle);
        vehicleAuditService.recordStatusChange(currentStatus, updated, oldActive, reason);
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
            vehiclePolicy.validateTargetCompany(company);
            return company;
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompanyOrThrow();
        vehiclePolicy.validateTargetCompany(company);
        return company;
    }
}
