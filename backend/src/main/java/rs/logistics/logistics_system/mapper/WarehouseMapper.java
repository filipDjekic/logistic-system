package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Warehouse;

public class WarehouseMapper {

    public static Warehouse toEntity(WarehouseCreate dto, Employee employee) {
        return new Warehouse(
                dto.getName(),
                dto.getAddress(),
                dto.getCity(),
                dto.getCapacity(),
                dto.getStatus(),
                employee
        );
    }

    public static void updateEntity(Warehouse warehouse, WarehouseUpdate dto) {
        warehouse.setName(dto.getName());
        warehouse.setAddress(dto.getAddress());
        warehouse.setCity(dto.getCity());
        warehouse.setCapacity(dto.getCapacity());
    }

    public static WarehouseResponse toResponse(Warehouse warehouse) {
        Long employeeId = warehouse.getManager() != null ? warehouse.getManager().getId() : null;
        String managerName = warehouse.getManager() != null
                ? warehouse.getManager().getFirstName() + " " + warehouse.getManager().getLastName()
                : null;

        return new WarehouseResponse(
                warehouse.getId(),
                warehouse.getName(),
                warehouse.getAddress(),
                warehouse.getCity(),
                warehouse.getCapacity(),
                warehouse.getStatus(),
                warehouse.getActive(),
                employeeId,
                managerName,
                warehouse.getCompany() != null ? warehouse.getCompany().getId() : null,
                warehouse.getCompany() != null ? warehouse.getCompany().getName() : null
        );
    }
}