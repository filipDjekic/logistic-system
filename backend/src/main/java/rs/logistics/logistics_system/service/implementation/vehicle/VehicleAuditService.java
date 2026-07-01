package rs.logistics.logistics_system.service.implementation.vehicle;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;

@Service
@RequiredArgsConstructor
public class VehicleAuditService {

    private final AuditFacadeDefinition auditFacade;

    public VehicleSnapshot snapshot(Vehicle vehicle) {
        return VehicleSnapshot.from(vehicle);
    }

    public void recordCreate(Vehicle vehicle) {
        auditFacade.recordCreate("VEHICLE", vehicle.getId());
        auditFacade.recordFieldChange("VEHICLE", vehicle.getId(), "company_id", null, vehicle.getCompany() != null ? vehicle.getCompany().getId() : null);
        auditFacade.log(
                "CREATE",
                "VEHICLE",
                vehicle.getId(),
                "Vehicle created (ID: " + vehicle.getId() + ", companyId: " + (vehicle.getCompany() != null ? vehicle.getCompany().getId() : null) + ")"
        );
    }

    public void recordUpdate(VehicleSnapshot before, Vehicle updated) {
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "registrationNumber", before.registrationNumber(), updated.getRegistrationNumber());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "vehicleModelId", before.vehicleModelId(), updated.getVehicleModel() != null ? updated.getVehicleModel().getId() : null);
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "brand", before.brand(), updated.getBrand());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "model", before.model(), updated.getModel());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "capacity", before.capacity(), updated.getCapacity());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "maxWeight", before.maxWeight(), updated.getMaxWeight());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "maxVolume", before.maxVolume(), updated.getMaxVolume());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "maxItems", before.maxItems(), updated.getMaxItems());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "status", before.status(), updated.getStatus());
        auditFacade.log("UPDATE", "VEHICLE", updated.getId(), "Vehicle updated (ID: " + updated.getId() + ")");
    }

    public void recordDelete(Long vehicleId) {
        auditFacade.recordDelete("VEHICLE", vehicleId);
        auditFacade.log("DELETE", "VEHICLE", vehicleId, "Vehicle deleted (ID: " + vehicleId + ")");
    }

    public void recordStatusChange(VehicleStatus currentStatus, Vehicle updated, Boolean oldActive, String reason) {
        auditFacade.recordStatusChange("VEHICLE", updated.getId(), "status", currentStatus, updated.getStatus());
        auditFacade.recordFieldChange("VEHICLE", updated.getId(), "active", oldActive, updated.getActive());
        auditFacade.log(
                "STATUS_CHANGED",
                "VEHICLE",
                updated.getId(),
                "Vehicle status changed from " + currentStatus + " to " + updated.getStatus() + transitionReasonSuffix(reason) + " (ID: " + updated.getId() + ")"
        );
    }

    private String transitionReasonSuffix(String reason) {
        if (reason == null || reason.isBlank()) {
            return "";
        }
        return " with reason: " + reason.trim();
    }

    public record VehicleSnapshot(
            String registrationNumber,
            Long vehicleModelId,
            String brand,
            String model,
            BigDecimal capacity,
            BigDecimal maxWeight,
            BigDecimal maxVolume,
            Integer maxItems,
            VehicleStatus status
    ) {
        static VehicleSnapshot from(Vehicle vehicle) {
            return new VehicleSnapshot(
                    vehicle.getRegistrationNumber(),
                    vehicle.getVehicleModel() != null ? vehicle.getVehicleModel().getId() : null,
                    vehicle.getBrand(),
                    vehicle.getModel(),
                    vehicle.getCapacity(),
                    vehicle.getMaxWeight(),
                    vehicle.getMaxVolume(),
                    vehicle.getMaxItems(),
                    vehicle.getStatus()
            );
        }
    }
}
