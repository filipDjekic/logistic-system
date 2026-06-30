package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.InventoryCountSessionCreate;
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountLineResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionSummaryResponse;
import rs.logistics.logistics_system.dto.update.InventoryCountLineUpdate;
import rs.logistics.logistics_system.service.definition.InventoryCountServiceDefinition;

import java.util.List;

@RestController
@RequestMapping({"/api/inventory-counts", "/api/inventory_counts"})
@RequiredArgsConstructor
public class InventoryCountController {
    private final InventoryCountServiceDefinition inventoryCountService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping
    public ResponseEntity<InventoryCountSessionResponse> create(@Valid @RequestBody InventoryCountSessionCreate dto) {
        return new ResponseEntity<>(inventoryCountService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping
    public ResponseEntity<List<InventoryCountSessionSummaryResponse>> getAll(@RequestParam(required = false) Long warehouseId) {
        return ResponseEntity.ok(inventoryCountService.getAll(warehouseId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping("/{id}")
    public ResponseEntity<InventoryCountSessionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.getById(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping("/{id}/lines")
    public ResponseEntity<PageResponse<InventoryCountLineResponse>> getLines(
            @PathVariable Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long binLocationId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 50, sort = "product.name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(inventoryCountService.getLines(id, search, zoneId, binLocationId, status, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/open")
    public ResponseEntity<InventoryCountSessionResponse> open(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.open(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/start")
    public ResponseEntity<InventoryCountSessionResponse> start(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.start(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @PatchMapping("/{sessionId}/lines/{lineId}")
    public ResponseEntity<InventoryCountSessionResponse> updateLine(@PathVariable Long sessionId, @PathVariable Long lineId, @Valid @RequestBody InventoryCountLineUpdate dto) {
        return ResponseEntity.ok(inventoryCountService.updateLine(sessionId, lineId, dto));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/submit-review")
    public ResponseEntity<InventoryCountSessionResponse> submitReview(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.submitReview(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<InventoryCountSessionResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.approve(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<InventoryCountSessionResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.reject(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/create-adjustments")
    public ResponseEntity<InventoryCountSessionResponse> createAdjustments(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.createAdjustments(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/close")
    public ResponseEntity<InventoryCountSessionResponse> close(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.close(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<InventoryCountSessionResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.cancel(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping("/{id}/allowed-status-transitions")
    public ResponseEntity<AllowedStatusTransitionsResponse> allowedStatusTransitions(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryCountService.allowedStatusTransitions(id));
    }
}
