package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.VehicleModel;

public class VehicleMapper {

    public static Vehicle toEntity(VehicleCreate dto, VehicleModel vehicleModel) {
        return new Vehicle(
                dto.getRegistrationNumber(),
                vehicleModel,
                dto.getType(),
                dto.getCapacity(),
                dto.getMaxWeight(),
                dto.getMaxVolume(),
                dto.getMaxItems(),
                dto.getFuelType(),
                dto.getYearOfProduction(),
                dto.getStatus()
        );
    }

    public static void updateEntity(Vehicle vehicle, VehicleUpdate dto, VehicleModel vehicleModel) {
        vehicle.setRegistrationNumber(dto.getRegistrationNumber());
        vehicle.setVehicleModel(vehicleModel);
        vehicle.setType(dto.getType());
        vehicle.setCapacity(dto.getCapacity());
        vehicle.setMaxWeight(dto.getMaxWeight());
        vehicle.setMaxVolume(dto.getMaxVolume());
        vehicle.setMaxItems(dto.getMaxItems());
        vehicle.setFuelType(dto.getFuelType());
        vehicle.setYearOfProduction(dto.getYearOfProduction());
        vehicle.setStatus(dto.getStatus());
    }

    public static VehicleResponse toResponse(Vehicle vehicle) {
        VehicleModel vehicleModel = vehicle.getVehicleModel();

        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getRegistrationNumber(),
                vehicleModel != null && vehicleModel.getBrand() != null ? vehicleModel.getBrand().getId() : null,
                vehicleModel != null && vehicleModel.getBrand() != null ? vehicleModel.getBrand().getName() : null,
                vehicleModel != null ? vehicleModel.getId() : null,
                vehicleModel != null ? vehicleModel.getName() : null,
                vehicle.getCapacity(),
                vehicle.getMaxWeight(),
                vehicle.getMaxVolume(),
                vehicle.getMaxItems(),
                vehicle.getType(),
                vehicle.getFuelType(),
                vehicle.getYearOfProduction(),
                vehicle.getStatus(),
                vehicle.getActive(),
                vehicle.getCompany() != null ? vehicle.getCompany().getId() : null,
                vehicle.getCompany() != null ? vehicle.getCompany().getName() : null
        );
    }
}