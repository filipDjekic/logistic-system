package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.math.BigDecimal;
import rs.logistics.logistics_system.enums.WarehouseZoneType;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.*;
import rs.logistics.logistics_system.dto.response.*;
import rs.logistics.logistics_system.dto.update.*;
import rs.logistics.logistics_system.service.definition.WarehouseLocationServiceDefinition;

@RestController
@RequestMapping("/api/warehouse-locations")
@RequiredArgsConstructor
public class WarehouseLocationController {

    private final WarehouseLocationServiceDefinition warehouseLocationService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/zones")
    public ResponseEntity<WarehouseZoneResponse> createZone(@Valid @RequestBody WarehouseZoneCreate dto) {
        return new ResponseEntity<>(warehouseLocationService.createZone(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PutMapping("/zones/{id}")
    public ResponseEntity<WarehouseZoneResponse> updateZone(@PathVariable Long id, @Valid @RequestBody WarehouseZoneUpdate dto) {
        return ResponseEntity.ok(warehouseLocationService.updateZone(id, dto));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/zones/{id}")
    public ResponseEntity<WarehouseZoneResponse> getZone(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseLocationService.getZone(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/zones")
    public ResponseEntity<PageResponse<WarehouseZoneResponse>> searchZones(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) WarehouseZoneType type,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(warehouseLocationService.searchZones(warehouseId, active, type, search, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @DeleteMapping("/zones/{id}")
    public ResponseEntity<Void> deleteZone(@PathVariable Long id) {
        warehouseLocationService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/bins")
    public ResponseEntity<BinLocationResponse> createBin(@Valid @RequestBody BinLocationCreate dto) {
        return new ResponseEntity<>(warehouseLocationService.createBin(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PutMapping("/bins/{id}")
    public ResponseEntity<BinLocationResponse> updateBin(@PathVariable Long id, @Valid @RequestBody BinLocationUpdate dto) {
        return ResponseEntity.ok(warehouseLocationService.updateBin(id, dto));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/bins/{id}")
    public ResponseEntity<BinLocationResponse> getBin(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseLocationService.getBin(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/bins")
    public ResponseEntity<PageResponse<BinLocationResponse>> searchBins(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) WarehouseZoneType type,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(warehouseLocationService.searchBins(warehouseId, zoneId, active, type, search, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @DeleteMapping("/bins/{id}")
    public ResponseEntity<Void> deleteBin(@PathVariable Long id) {
        warehouseLocationService.deleteBin(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER')")
    @PostMapping("/bin-inventory")
    public ResponseEntity<BinInventoryResponse> setBinInventory(@Valid @RequestBody BinInventoryCreate dto) {
        return ResponseEntity.ok(warehouseLocationService.setBinInventory(dto));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/bin-inventory")
    public ResponseEntity<PageResponse<BinInventoryResponse>> searchBinInventory(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long binLocationId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) BigDecimal quantityMin,
            @RequestParam(required = false) BigDecimal quantityMax,
            @RequestParam(required = false) Boolean reserved,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "lastUpdated", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(warehouseLocationService.searchBinInventory(warehouseId, zoneId, binLocationId, productId, quantityMin, quantityMax, reserved, available, search, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER','WORKER')")
    @PostMapping("/internal-movements")
    public ResponseEntity<InternalWarehouseMovementResponse> moveInternal(@Valid @RequestBody InternalWarehouseMovementCreate dto) {
        return new ResponseEntity<>(warehouseLocationService.moveInternal(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER','WORKER')")
    @GetMapping("/internal-movements")
    public ResponseEntity<PageResponse<InternalWarehouseMovementResponse>> searchInternalMovements(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long binLocationId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(warehouseLocationService.searchInternalMovements(warehouseId, productId, zoneId, binLocationId, search, pageable));
    }
}
