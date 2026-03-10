package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Vehicle;

public class VehicleMapper {

    public static Vehicle toEntity(VehicleCreate dto) {
        Vehicle vehicle = new Vehicle(
                dto.getRegistrationNumber(),
                dto.getBrand(),
                dto.getModel(),
                dto.getType(),
                dto.getCapacity(),
                dto.getFuelType(),
                dto.getYearOfProduction(),
                dto.getStatus()
        );

        return vehicle;
    }

    public static void updateEntity(Vehicle vehicle, VehicleUpdate dto){
        vehicle.setRegistrationNumber(dto.getRegistrationNumber());
        vehicle.setBrand(dto.getBrand());
        vehicle.setModel(dto.getModel());
        vehicle.setType(dto.getType());
        vehicle.setCapacity(dto.getCapacity());
        vehicle.setFuelType(dto.getFuelType());
        vehicle.setYearOfProduction(dto.getYearOfProduction());
        vehicle.setStatus(dto.getStatus());
    }

    public static VehicleResponse toResponse(Vehicle vehicle){
        VehicleResponse response = new VehicleResponse(
                vehicle.getId(),
                vehicle.getRegistrationNumber(),
                vehicle.getBrand(),
                vehicle.getModel(),
                vehicle.getCapacity(),
                vehicle.getType(),
                vehicle.getFuelType(),
                vehicle.getYearOfProduction(),
                vehicle.getStatus()
        );

        return  response;
    }
}
