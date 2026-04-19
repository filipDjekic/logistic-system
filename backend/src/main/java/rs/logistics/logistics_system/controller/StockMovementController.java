package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/stock_movements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementServiceDefinition stockMovementService;

    @PreAuthorize("hasAnyRole('OVERLORD','WAREHOUSE_MANAGER')")
    @PostMapping
    public ResponseEntity<StockMovementResponse> create(@Valid @RequestBody StockMovementCreate dto) {
        return new ResponseEntity<>(stockMovementService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<StockMovementResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.getById(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping
    public ResponseEntity<List<StockMovementResponse>> getAll() {
        return ResponseEntity.ok(stockMovementService.getAll());
    }
}
