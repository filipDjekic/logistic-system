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
import rs.logistics.logistics_system.dto.create.StockAdjustmentCreate;
import rs.logistics.logistics_system.dto.create.StockInboundCreate;
import rs.logistics.logistics_system.dto.create.StockOutboundCreate;
import rs.logistics.logistics_system.dto.create.StockReturnCreate;
import rs.logistics.logistics_system.dto.create.StockTransferCreate;
import rs.logistics.logistics_system.dto.create.StockWriteOffCreate;
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.response.StockMovementContextResponse;
import rs.logistics.logistics_system.dto.response.StockMovementTraceResponse;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/stock_movements", "/api/stock-movements"})
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementServiceDefinition stockMovementService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','WORKER')")
    @GetMapping("/context")
    public ResponseEntity<StockMovementContextResponse> context(
            @RequestParam Long warehouseId,
            @RequestParam Long productId,
            @RequestParam(required = false) Long binLocationId
    ) {
        return ResponseEntity.ok(stockMovementService.getMovementContext(warehouseId, productId, binLocationId));
    }

    @PreAuthorize("@authorization.canCreateStockMovement(#dto.warehouseId)")
    @PostMapping("/inbound")
    public ResponseEntity<StockMovementResponse> inbound(@Valid @RequestBody StockInboundCreate dto) {
        return new ResponseEntity<>(stockMovementService.inbound(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("@authorization.canCreateStockMovement(#dto.warehouseId)")
    @PostMapping("/outbound")
    public ResponseEntity<StockMovementResponse> outbound(@Valid @RequestBody StockOutboundCreate dto) {
        return new ResponseEntity<>(stockMovementService.outbound(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("@authorization.canCreateStockTransfer(#dto.sourceWarehouseId, #dto.destinationWarehouseId)")
    @PostMapping("/transfer")
    public ResponseEntity<List<StockMovementResponse>> transfer(@Valid @RequestBody StockTransferCreate dto) {
        return new ResponseEntity<>(stockMovementService.transfer(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("@authorization.canCreateStockMovement(#dto.warehouseId)")
    @PostMapping("/adjustment")
    public ResponseEntity<StockMovementResponse> adjustment(@Valid @RequestBody StockAdjustmentCreate dto) {
        return new ResponseEntity<>(stockMovementService.adjustment(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("@authorization.canCreateStockMovement(#dto.warehouseId)")
    @PostMapping("/write-off")
    public ResponseEntity<StockMovementResponse> writeOff(@Valid @RequestBody StockWriteOffCreate dto) {
        return new ResponseEntity<>(stockMovementService.writeOff(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("@authorization.canCreateStockMovement(#dto.warehouseId)")
    @PostMapping("/return")
    public ResponseEntity<StockMovementResponse> returnStock(@Valid @RequestBody StockReturnCreate dto) {
        return new ResponseEntity<>(stockMovementService.returnStock(dto), HttpStatus.CREATED);
    }


    @PreAuthorize("@authorization.canExecuteStockMovement(#id)")
    @PostMapping("/{id}/execute")
    public ResponseEntity<StockMovementResponse> execute(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.execute(id));
    }

    @PreAuthorize("@authorization.canExecuteStockMovement(#id)")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<StockMovementResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.cancel(id));
    }

    @PreAuthorize("@authorization.canApproveStockMovement(#id)")
    @PostMapping("/{id}/approve")
    public ResponseEntity<StockMovementResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.approve(id));
    }

    @PreAuthorize("@authorization.canApproveStockMovement(#id)")
    @PostMapping("/{id}/reject")
    public ResponseEntity<StockMovementResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.reject(id));
    }

    @PreAuthorize("@authorization.canExecuteStockMovement(#id)")
    @PostMapping("/{id}/reverse")
    public ResponseEntity<StockMovementResponse> reverse(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.reverse(id));
    }

    @PreAuthorize("@authorization.canReadStockMovement(#id)")
    @GetMapping("/{id}")
    public ResponseEntity<StockMovementResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.getById(id));
    }

    @PreAuthorize("@authorization.canReadStockMovement(#id)")
    @GetMapping("/{id}/status-transitions")
    public ResponseEntity<AllowedStatusTransitionsResponse> allowedStatusTransitions(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.allowedStatusTransitions(id));
    }

    @PreAuthorize("@authorization.canReadStockMovement(#id)")
    @GetMapping("/{id}/trace")
    public ResponseEntity<StockMovementTraceResponse> trace(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.trace(id));
    }

    @PreAuthorize("@authorization.canListStockMovements()")
    @GetMapping("/batches/{lotNumber}/history")
    public ResponseEntity<List<StockMovementResponse>> batchHistory(@PathVariable String lotNumber) {
        return ResponseEntity.ok(stockMovementService.batchHistory(lotNumber));
    }

    @PreAuthorize("@authorization.canListStockMovements()")
    @GetMapping("/serials/{serialNumber}/history")
    public ResponseEntity<List<StockMovementResponse>> serialHistory(@PathVariable String serialNumber) {
        return ResponseEntity.ok(stockMovementService.serialHistory(serialNumber));
    }

    @PreAuthorize("@authorization.canListStockMovements()")
    @GetMapping
    public ResponseEntity<PageResponse<StockMovementResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) StockMovementType movementType,
            @RequestParam(required = false) StockMovementStatus status,
            @RequestParam(required = false) StockMovementReasonCode reasonCode,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long transportOrderId,
            @RequestParam(required = false) Long binLocationId,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(stockMovementService.search(
                search,
                movementType,
                status,
                reasonCode,
                warehouseId,
                productId,
                transportOrderId,
                binLocationId,
                fromDate,
                toDate,
                pageable
        ));
    }
}
