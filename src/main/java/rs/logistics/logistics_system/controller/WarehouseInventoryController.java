package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/warehouse-inventory")
@RequiredArgsConstructor
public class WarehouseInventoryController {

    private final WarehouseInventoryServiceDefinition warehouseInventoryService;

    @PostMapping
    public ResponseEntity<WarehouseInventoryResponse> create(@Valid @RequestBody WarehouseInventoryCreate dto) {
        return new ResponseEntity<>(warehouseInventoryService.create(dto),HttpStatus.CREATED);
    }

    @PutMapping("/{warehouseId}/{productId}")
    public ResponseEntity<WarehouseInventoryResponse> update(@PathVariable Long warehouseId,@PathVariable Long productId,@Valid @RequestBody WarehouseInventoryUpdate dto) {
        return ResponseEntity.ok(warehouseInventoryService.update(warehouseId, productId, dto));
    }

    @GetMapping("/{warehouseId}/{productId}")
    public ResponseEntity<WarehouseInventoryResponse> findOne(@PathVariable Long warehouseId,@PathVariable Long productId) {
        return ResponseEntity.ok(warehouseInventoryService.findByWarehouseAndProduct(warehouseId, productId));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<WarehouseInventoryResponse>> findByWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(warehouseInventoryService.findByWarehouse(warehouseId));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<WarehouseInventoryResponse>> findByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(warehouseInventoryService.findByProduct(productId));
    }

    @DeleteMapping("/{warehouseId}/{productId}")
    public ResponseEntity<Void> delete(@PathVariable Long warehouseId,@PathVariable Long productId) {
        warehouseInventoryService.delete(warehouseId, productId);
        return ResponseEntity.noContent().build();
    }
}
