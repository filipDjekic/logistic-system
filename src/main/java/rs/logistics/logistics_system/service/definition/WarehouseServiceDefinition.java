package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Employee;

import java.util.List;

public interface WarehouseServiceDefinition {

    WarehouseResponse create(WarehouseCreate dto);

    WarehouseResponse update(Long id, WarehouseUpdate dto);

    WarehouseResponse getById(Long id);

    List<WarehouseResponse> getAll();

    void delete(Long id);
}
