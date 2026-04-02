package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;

import java.math.BigDecimal;

public class TransportOrderMapper {

    public static TransportOrder toEntity(TransportOrderCreate dto, Warehouse warehouseSource, Warehouse warehouseDestination, Vehicle vehicle, Employee assignedEmployee, User createdBy) {
        return new TransportOrder(
                dto.getOrderNumber(),
                dto.getDescription(),
                dto.getOrderDate(),
                dto.getDepartureTime(),
                dto.getPlannedArrivalTime(),
                dto.getPriority(),
                BigDecimal.ZERO,
                dto.getNotes(),
                warehouseSource,
                warehouseDestination,
                vehicle,
                assignedEmployee,
                createdBy
        );
    }

    public static void updateEntity(TransportOrderUpdate dto, TransportOrder transportOrder, Warehouse warehouseSource, Warehouse warehouseDestination, Vehicle vehicle, Employee assignedEmployee) {
        transportOrder.setOrderNumber(dto.getOrderNumber());
        transportOrder.setDescription(dto.getDescription());
        transportOrder.setOrderDate(dto.getOrderDate());
        transportOrder.setDepartureTime(dto.getDepartureTime());
        transportOrder.setPlannedArrivalTime(dto.getPlannedArrivalTime());
        transportOrder.setActualArrivalTime(dto.getActualArrivalTime());
        transportOrder.setPriority(dto.getPriority());
        transportOrder.setNotes(dto.getNotes());
        transportOrder.setSourceWarehouse(warehouseSource);
        transportOrder.setDestinationWarehouse(warehouseDestination);
        transportOrder.setVehicle(vehicle);
        transportOrder.setAssignedEmployee(assignedEmployee);
    }

    public static TransportOrderResponse toResponse(TransportOrder transportOrder) {
        return new TransportOrderResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber(),
                transportOrder.getDescription(),
                transportOrder.getOrderDate(),
                transportOrder.getDepartureTime(),
                transportOrder.getPlannedArrivalTime(),
                transportOrder.getActualArrivalTime(),
                transportOrder.getStatus(),
                transportOrder.getPriority(),
                transportOrder.getTotalWeight(),
                transportOrder.getNotes(),
                transportOrder.getSourceWarehouse().getId(),
                transportOrder.getDestinationWarehouse().getId(),
                transportOrder.getVehicle().getId(),
                transportOrder.getAssignedEmployee().getId(),
                transportOrder.getCreatedBy().getId()
        );
    }
}