package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.response.LookupOptionResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;

public interface LookupServiceDefinition {

    PageResponse<LookupOptionResponse> warehouses(String search, Pageable pageable);

    PageResponse<LookupOptionResponse> products(String search, Pageable pageable);

    PageResponse<LookupOptionResponse> vehicles(String search, Pageable pageable);

    PageResponse<LookupOptionResponse> employees(String search, Pageable pageable);

    PageResponse<LookupOptionResponse> transportOrders(String search, Pageable pageable);

    PageResponse<LookupOptionResponse> stockMovements(String search, Pageable pageable);

    PageResponse<LookupOptionResponse> binLocations(String search, Long warehouseId, Boolean activeOnly, Pageable pageable);

    PageResponse<LookupOptionResponse> companies(String search, Pageable pageable);
}
