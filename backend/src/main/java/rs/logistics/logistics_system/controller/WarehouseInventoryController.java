package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;

@RestController
@RequestMapping("/api/warehouse-inventory")
@RequiredArgsConstructor
public class WarehouseInventoryController {

    private final WarehouseInventoryServiceDefinition warehouseInventoryService;

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER')")
    @PostMapping
    public ResponseEntity<WarehouseInventoryResponse> create(@Valid @RequestBody WarehouseInventoryCreate dto) {
        return new ResponseEntity<>(warehouseInventoryService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER')")
    @PutMapping("/{warehouseId}/{productId}")
    public ResponseEntity<WarehouseInventoryResponse> update(
            @PathVariable Long warehouseId,
            @PathVariable Long productId,
            @Valid @RequestBody WarehouseInventoryUpdate dto
    ) {
        return new ResponseEntity<>(warehouseInventoryService.update(warehouseId, productId, dto), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping
    public ResponseEntity<PageResponse<WarehouseInventoryResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "warehouse.name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(warehouseInventoryService.search(search, warehouseId, productId, status, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/{warehouseId}/{productId}")
    public ResponseEntity<WarehouseInventoryResponse> getById(
            @PathVariable Long warehouseId,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(warehouseInventoryService.findByWarehouseAndProduct(warehouseId, productId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<WarehouseInventoryResponse>> getByWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(warehouseInventoryService.findByWarehouse(warehouseId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<WarehouseInventoryResponse>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(warehouseInventoryService.findByProduct(productId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER')")
    @DeleteMapping("/{warehouseId}/{productId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long warehouseId,
            @PathVariable Long productId
    ) {
        warehouseInventoryService.delete(warehouseId, productId);
        return ResponseEntity.noContent().build();
    }
}
