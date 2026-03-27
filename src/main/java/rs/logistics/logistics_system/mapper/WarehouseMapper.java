package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Warehouse;

public class WarehouseMapper {

    public static Warehouse toEntity(WarehouseCreate dto, Employee employee) {
        Warehouse warehouse = new Warehouse(
                dto.getName(),
                dto.getAddress(),
                dto.getCity(),
                dto.getCapacity(),
                dto.getStatus(),
                employee
        );

        return warehouse;
    }

    public static void updateEntity(Warehouse warehouse, WarehouseUpdate dto) {
        warehouse.setName(dto.getName());
        warehouse.setAddress(dto.getAddress());
        warehouse.setCity(dto.getCity());
        warehouse.setCapacity(dto.getCapacity());
    }

    public static WarehouseResponse toResponse(Warehouse warehouse) {
        WarehouseResponse warehouseResponse = new WarehouseResponse(
                warehouse.getId(),
                warehouse.getName(),
                warehouse.getAddress(),
                warehouse.getCity(),
                warehouse.getCapacity(),
                warehouse.getStatus(),
                warehouse.getManager().getId()
        );

        return  warehouseResponse;
    }
}
