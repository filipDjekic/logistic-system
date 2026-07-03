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
import rs.logistics.logistics_system.dto.create.StockMovementRequestCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementRequestResponse;
import rs.logistics.logistics_system.dto.update.StockMovementRequestReview;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;
import rs.logistics.logistics_system.service.definition.StockMovementRequestServiceDefinition;

@RestController
@RequestMapping({"/api/stock_movement_requests", "/api/stock-movement-requests"})
@RequiredArgsConstructor
public class StockMovementRequestController {

    private final StockMovementRequestServiceDefinition stockMovementRequestService;

    @PreAuthorize("hasRole('WORKER')")
    @PostMapping
    public ResponseEntity<StockMovementRequestResponse> create(@Valid @RequestBody StockMovementRequestCreate dto) {
        return new ResponseEntity<>(stockMovementRequestService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping
    public ResponseEntity<PageResponse<StockMovementRequestResponse>> search(
            @RequestParam(required = false) StockMovementRequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(stockMovementRequestService.search(status, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping("/{id}")
    public ResponseEntity<StockMovementRequestResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementRequestService.getById(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<StockMovementRequestResponse> approve(@PathVariable Long id, @Valid @RequestBody(required = false) StockMovementRequestReview review) {
        return ResponseEntity.ok(stockMovementRequestService.approve(id, review));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<StockMovementRequestResponse> reject(@PathVariable Long id, @Valid @RequestBody(required = false) StockMovementRequestReview review) {
        return ResponseEntity.ok(stockMovementRequestService.reject(id, review));
    }

    @PreAuthorize("hasRole('WORKER')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<StockMovementRequestResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementRequestService.cancel(id));
    }
}
