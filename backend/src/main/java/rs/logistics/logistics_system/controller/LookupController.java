package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.response.LookupOptionResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.service.definition.LookupServiceDefinition;
import rs.logistics.logistics_system.enums.VehicleStatus;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LookupController {

    private final LookupServiceDefinition lookupService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/warehouses/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> warehouses(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "read") String accessMode,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.warehouses(search, accessMode, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/products/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long warehouseId,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.products(search, warehouseId, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER')")
    @GetMapping("/vehicles/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> vehicles(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) Boolean available,
            @PageableDefault(size = 20, sort = "registrationNumber", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.vehicles(search, status, available, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/employees/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> employees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeePosition position,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String linkedUser,
            @RequestParam(required = false) LocalDateTime availableFrom,
            @RequestParam(required = false) LocalDateTime availableTo,
            @PageableDefault(size = 20, sort = "lastName", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.employees(
                search,
                position,
                active,
                linkedUser,
                availableFrom,
                availableTo,
                pageable
        ));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','DRIVER','WORKER')")
    @GetMapping("/transport-orders/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> transportOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long sourceWarehouseId,
            @RequestParam(required = false) Long destinationWarehouseId,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.transportOrders(search, sourceWarehouseId, destinationWarehouseId, pageable));
    }



    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/stock-movements/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> stockMovements(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.stockMovements(search, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping("/bin-locations/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> binLocations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(defaultValue = "true") Boolean activeOnly,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.binLocations(search, warehouseId, activeOnly, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @GetMapping("/companies/lookup")
    public ResponseEntity<PageResponse<LookupOptionResponse>> companies(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(lookupService.companies(search, pageable));
    }
}
