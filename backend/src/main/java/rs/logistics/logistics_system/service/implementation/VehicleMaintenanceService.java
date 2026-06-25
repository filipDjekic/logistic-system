package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.VehicleMaintenanceCancel;
import rs.logistics.logistics_system.dto.create.VehicleMaintenanceCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.VehicleMaintenanceResponse;
import rs.logistics.logistics_system.dto.update.VehicleMaintenanceUpdate;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.VehicleMaintenance;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.VehicleMaintenanceMapper;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleMaintenanceRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.definition.VehicleMaintenanceServiceDefinition;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VehicleMaintenanceService implements VehicleMaintenanceServiceDefinition {

    private static final Set<VehicleMaintenanceStatus> ACTIVE_MAINTENANCE_STATUSES = Set.of(
            VehicleMaintenanceStatus.PLANNED,
            VehicleMaintenanceStatus.IN_PROGRESS
    );

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = List.of(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING,
            TransportOrderStatus.RESCHEDULED
    );

    private final VehicleMaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AuditFacadeDefinition auditFacade;
    private final TimeServiceDefinition timeService;

    @Override
    @Transactional
    public VehicleMaintenanceResponse create(VehicleMaintenanceCreate dto) {
        Vehicle vehicle = getAccessibleVehicle(dto.getVehicleId());
        validateVehicleCanEnterMaintenance(vehicle, null);

        VehicleMaintenance maintenance = VehicleMaintenanceMapper.toEntity(dto, vehicle);
        VehicleMaintenance saved = maintenanceRepository.save(maintenance);

        auditFacade.recordCreate("VEHICLE_MAINTENANCE", saved.getId());
        auditFacade.log("CREATE", "VEHICLE_MAINTENANCE", saved.getId(), "Vehicle maintenance scheduled for vehicleId=" + vehicle.getId());
        return VehicleMaintenanceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public VehicleMaintenanceResponse update(Long id, VehicleMaintenanceUpdate dto) {
        VehicleMaintenance maintenance = getAccessibleMaintenance(id);
        if (maintenance.getStatus() != VehicleMaintenanceStatus.PLANNED) {
            throw new BadRequestException("Only planned maintenance can be updated");
        }
        validateVehicleCanEnterMaintenance(maintenance.getVehicle(), maintenance.getId());
        VehicleMaintenanceMapper.updateEntity(maintenance, dto);
        VehicleMaintenance saved = maintenanceRepository.save(maintenance);
        auditFacade.log("UPDATE", "VEHICLE_MAINTENANCE", saved.getId(), "Vehicle maintenance updated");
        return VehicleMaintenanceMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleMaintenanceResponse getById(Long id) {
        return VehicleMaintenanceMapper.toResponse(getAccessibleMaintenance(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VehicleMaintenanceResponse> getAll(Long vehicleId, VehicleMaintenanceStatus status, Pageable pageable) {
        if (authenticatedUserProvider.hasRole("DRIVER")) {
            var page = maintenanceRepository.findForDriverRelatedVehicles(
                    authenticatedUserProvider.getAuthenticatedUserId(),
                    vehicleId,
                    status,
                    pageable
            );
            return PageResponse.from(page.map(VehicleMaintenanceMapper::toResponse));
        }

        Long companyId = authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        var page = findMaintenancePage(companyId, vehicleId, status, pageable);
        return PageResponse.from(page.map(VehicleMaintenanceMapper::toResponse));
    }

    private org.springframework.data.domain.Page<VehicleMaintenance> findMaintenancePage(
            Long companyId,
            Long vehicleId,
            VehicleMaintenanceStatus status,
            Pageable pageable
    ) {
        if (companyId == null) {
            if (vehicleId != null && status != null) {
                return maintenanceRepository.findByVehicle_IdAndStatus(vehicleId, status, pageable);
            }
            if (vehicleId != null) {
                return maintenanceRepository.findByVehicle_Id(vehicleId, pageable);
            }
            if (status != null) {
                return maintenanceRepository.findByStatus(status, pageable);
            }
            return maintenanceRepository.findAll(pageable);
        }

        if (vehicleId != null && status != null) {
            return maintenanceRepository.findByCompany_IdAndVehicle_IdAndStatus(companyId, vehicleId, status, pageable);
        }
        if (vehicleId != null) {
            return maintenanceRepository.findByCompany_IdAndVehicle_Id(companyId, vehicleId, pageable);
        }
        if (status != null) {
            return maintenanceRepository.findByCompany_IdAndStatus(companyId, status, pageable);
        }
        return maintenanceRepository.findByCompany_Id(companyId, pageable);
    }

    @Override
    @Transactional
    public VehicleMaintenanceResponse start(Long id) {
        VehicleMaintenance maintenance = getAccessibleMaintenance(id);
        if (maintenance.getStatus() != VehicleMaintenanceStatus.PLANNED) {
            throw new BadRequestException("Only planned maintenance can be started");
        }
        validateVehicleCanEnterMaintenance(maintenance.getVehicle(), maintenance.getId());
        maintenance.setStatus(VehicleMaintenanceStatus.IN_PROGRESS);
        maintenance.setStartedAt(timeService.nowSystem());
        maintenance.getVehicle().setStatus(VehicleStatus.MAINTENANCE);
        vehicleRepository.save(maintenance.getVehicle());
        VehicleMaintenance saved = maintenanceRepository.save(maintenance);
        auditFacade.recordStatusChange("VEHICLE_MAINTENANCE", saved.getId(), "status", VehicleMaintenanceStatus.PLANNED, VehicleMaintenanceStatus.IN_PROGRESS);
        auditFacade.recordStatusChange("VEHICLE", maintenance.getVehicle().getId(), "status", VehicleStatus.AVAILABLE, VehicleStatus.MAINTENANCE);
        return VehicleMaintenanceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public VehicleMaintenanceResponse complete(Long id) {
        VehicleMaintenance maintenance = getAccessibleMaintenance(id);
        if (maintenance.getStatus() != VehicleMaintenanceStatus.IN_PROGRESS) {
            throw new BadRequestException("Only in-progress maintenance can be completed");
        }
        maintenance.setStatus(VehicleMaintenanceStatus.COMPLETED);
        maintenance.setCompletedAt(timeService.nowSystem());
        maintenance.getVehicle().setStatus(VehicleStatus.AVAILABLE);
        maintenance.getVehicle().setActive(true);
        vehicleRepository.save(maintenance.getVehicle());
        VehicleMaintenance saved = maintenanceRepository.save(maintenance);
        auditFacade.recordStatusChange("VEHICLE_MAINTENANCE", saved.getId(), "status", VehicleMaintenanceStatus.IN_PROGRESS, VehicleMaintenanceStatus.COMPLETED);
        return VehicleMaintenanceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public VehicleMaintenanceResponse cancel(Long id, VehicleMaintenanceCancel dto) {
        VehicleMaintenance maintenance = getAccessibleMaintenance(id);
        if (maintenance.getStatus() == VehicleMaintenanceStatus.COMPLETED || maintenance.getStatus() == VehicleMaintenanceStatus.CANCELLED) {
            throw new BadRequestException("Completed or cancelled maintenance cannot be cancelled again");
        }
        VehicleMaintenanceStatus oldStatus = maintenance.getStatus();
        maintenance.setStatus(VehicleMaintenanceStatus.CANCELLED);
        maintenance.setCancelledAt(timeService.nowSystem());
        maintenance.setCancelReason(dto != null ? dto.getCancelReason() : null);
        if (maintenance.getVehicle().getStatus() == VehicleStatus.MAINTENANCE) {
            maintenance.getVehicle().setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(maintenance.getVehicle());
        }
        VehicleMaintenance saved = maintenanceRepository.save(maintenance);
        auditFacade.recordStatusChange("VEHICLE_MAINTENANCE", saved.getId(), "status", oldStatus, VehicleMaintenanceStatus.CANCELLED);
        return VehicleMaintenanceMapper.toResponse(saved);
    }

    private Vehicle getAccessibleVehicle(Long vehicleId) {
        if (authenticatedUserProvider.isOverlord()) {
            return vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        }
        return vehicleRepository.findByIdAndCompany_Id(vehicleId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
    }

    private VehicleMaintenance getAccessibleMaintenance(Long id) {
        VehicleMaintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle maintenance not found"));
        if (!authenticatedUserProvider.isOverlord()) {
            Long companyId = maintenance.getCompany() != null ? maintenance.getCompany().getId() : null;
            if (!authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow().equals(companyId)) {
                throw new ResourceNotFoundException("Vehicle maintenance not found");
            }
        }

        if (authenticatedUserProvider.hasRole("DRIVER")) {
            boolean related = maintenanceRepository.existsForDriverRelatedVehicle(
                    id,
                    authenticatedUserProvider.getAuthenticatedUserId()
            );
            if (!related) {
                throw new ResourceNotFoundException("Vehicle maintenance not found");
            }
        }
        return maintenance;
    }

    private void validateVehicleCanEnterMaintenance(Vehicle vehicle, Long excludedMaintenanceId) {
        if (vehicle == null || vehicle.getId() == null) {
            throw new BadRequestException("Vehicle is required");
        }
        if (!Boolean.TRUE.equals(vehicle.getActive())) {
            throw new BadRequestException("Inactive vehicle cannot enter maintenance");
        }
        if (vehicle.getStatus() == VehicleStatus.RESERVED || vehicle.getStatus() == VehicleStatus.IN_USE) {
            throw new BadRequestException("Vehicle with reserved or active transport cannot enter maintenance");
        }
        boolean hasActiveTransport = transportOrderRepository.existsByVehicleIdAndStatusIn(vehicle.getId(), ACTIVE_TRANSPORT_STATUSES);
        if (hasActiveTransport) {
            throw new BadRequestException("Vehicle has active transport and cannot enter maintenance");
        }
        boolean hasActiveMaintenance = excludedMaintenanceId == null
                ? maintenanceRepository.existsByVehicleIdAndStatusIn(vehicle.getId(), ACTIVE_MAINTENANCE_STATUSES)
                : maintenanceRepository.existsByVehicleIdAndStatusInAndIdNot(vehicle.getId(), ACTIVE_MAINTENANCE_STATUSES, excludedMaintenanceId);
        if (hasActiveMaintenance) {
            throw new BadRequestException("Vehicle already has active maintenance");
        }
    }
}
