package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.VehicleMaintenanceCreate;
import rs.logistics.logistics_system.dto.response.VehicleMaintenanceResponse;
import rs.logistics.logistics_system.dto.update.VehicleMaintenanceUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.VehicleMaintenance;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;

public class VehicleMaintenanceMapper {

    public static VehicleMaintenance toEntity(VehicleMaintenanceCreate dto, Vehicle vehicle) {
        VehicleMaintenance maintenance = new VehicleMaintenance();
        maintenance.setVehicle(vehicle);
        maintenance.setCompany(vehicle.getCompany());
        maintenance.setType(dto.getType());
        maintenance.setStatus(VehicleMaintenanceStatus.PLANNED);
        maintenance.setScheduledAt(dto.getScheduledAt());
        maintenance.setOdometer(dto.getOdometer());
        maintenance.setCost(dto.getCost());
        maintenance.setNotes(dto.getNotes());
        return maintenance;
    }

    public static void updateEntity(VehicleMaintenance maintenance, VehicleMaintenanceUpdate dto) {
        maintenance.setType(dto.getType());
        maintenance.setScheduledAt(dto.getScheduledAt());
        maintenance.setOdometer(dto.getOdometer());
        maintenance.setCost(dto.getCost());
        maintenance.setNotes(dto.getNotes());
    }

    public static VehicleMaintenanceResponse toResponse(VehicleMaintenance maintenance) {
        Vehicle vehicle = maintenance.getVehicle();
        Company company = maintenance.getCompany();

        VehicleMaintenanceResponse response = new VehicleMaintenanceResponse();
        response.setId(maintenance.getId());
        response.setVehicleId(vehicle != null ? vehicle.getId() : null);
        response.setVehicleRegistrationNumber(vehicle != null ? vehicle.getRegistrationNumber() : null);
        response.setCompanyId(company != null ? company.getId() : null);
        response.setCompanyName(company != null ? company.getName() : null);
        response.setType(maintenance.getType());
        response.setStatus(maintenance.getStatus());
        response.setScheduledAt(maintenance.getScheduledAt());
        response.setStartedAt(maintenance.getStartedAt());
        response.setCompletedAt(maintenance.getCompletedAt());
        response.setCancelledAt(maintenance.getCancelledAt());
        response.setOdometer(maintenance.getOdometer());
        response.setCost(maintenance.getCost());
        response.setNotes(maintenance.getNotes());
        response.setCancelReason(maintenance.getCancelReason());
        response.setActiveMaintenance(maintenance.isActiveMaintenance());
        response.setCreatedAt(maintenance.getCreatedAt());
        response.setUpdatedAt(maintenance.getUpdatedAt());
        return response;
    }
}
