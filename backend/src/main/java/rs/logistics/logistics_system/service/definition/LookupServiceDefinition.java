package rs.logistics.logistics_system.service.definition;

import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.response.LookupOptionResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.VehicleStatus;

public interface LookupServiceDefinition {

    PageResponse<LookupOptionResponse> warehouses(String search, String accessMode, Pageable pageable);

    PageResponse<LookupOptionResponse> products(String search, Long warehouseId, Pageable pageable);

    PageResponse<LookupOptionResponse> vehicles(
        String search,
        VehicleStatus status,
        Boolean available,
        Pageable pageable
    );

    PageResponse<LookupOptionResponse> employees(
        String search,
        EmployeePosition position,
        Boolean active,
        String linkedUser,
        LocalDateTime availableFrom,
        LocalDateTime availableTo,
        Pageable pageable
    );

    PageResponse<LookupOptionResponse> transportOrders(String search, Long sourceWarehouseId, Long destinationWarehouseId, Pageable pageable);

    PageResponse<LookupOptionResponse> stockMovements(String search, Pageable pageable);

    PageResponse<LookupOptionResponse> binLocations(String search, Long warehouseId, Boolean activeOnly, Pageable pageable);

    PageResponse<LookupOptionResponse> companies(String search, Pageable pageable);
}
