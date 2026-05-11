package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.create.VehicleMaintenanceCancel;
import rs.logistics.logistics_system.dto.create.VehicleMaintenanceCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.VehicleMaintenanceResponse;
import rs.logistics.logistics_system.dto.update.VehicleMaintenanceUpdate;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;

public interface VehicleMaintenanceServiceDefinition {
    VehicleMaintenanceResponse create(VehicleMaintenanceCreate dto);
    VehicleMaintenanceResponse update(Long id, VehicleMaintenanceUpdate dto);
    VehicleMaintenanceResponse getById(Long id);
    PageResponse<VehicleMaintenanceResponse> getAll(Long vehicleId, VehicleMaintenanceStatus status, Pageable pageable);
    VehicleMaintenanceResponse start(Long id);
    VehicleMaintenanceResponse complete(Long id);
    VehicleMaintenanceResponse cancel(Long id, VehicleMaintenanceCancel dto);
}
