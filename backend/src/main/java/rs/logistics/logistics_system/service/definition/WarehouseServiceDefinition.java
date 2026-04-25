package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.util.List;

public interface WarehouseServiceDefinition {

    WarehouseResponse create(WarehouseCreate dto);

    WarehouseResponse update(Long id, WarehouseUpdate dto);

    WarehouseResponse getById(Long id);

    WarehouseResponse assignEmployee(Long warehouseId, Long employeeId);

    PageResponse<WarehouseResponse> getAll(String search, WarehouseStatus status, Boolean active, Long managerId, Pageable pageable);

    void delete(Long id);

    WarehouseResponse changeStatus(Long warehouseId, WarehouseStatus status);

    List<WarehouseInventoryResponse> getInventoryByWarehouse(Long warehouseId);

    List<TransportOrderResponse> getOutgoingTransportOrders(Long id);

    List<TransportOrderResponse> getIncomingTransportOrders(Long id);

    List<WarehouseResponse> getByManager(Long managerId);
}
