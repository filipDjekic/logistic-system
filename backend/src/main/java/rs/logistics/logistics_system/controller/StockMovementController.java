package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;

@PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
@RestController
@RequestMapping("api/stock_movements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementServiceDefinition stockMovementService;

    @PostMapping
    public ResponseEntity<StockMovementResponse> addStockMovement(@Valid @RequestBody StockMovementCreate dto) {
        StockMovementResponse response = stockMovementService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockMovementResponse> getById(@PathVariable Long id) {
        StockMovementResponse response = stockMovementService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<StockMovementResponse>> getAll() {
        List<StockMovementResponse> response = stockMovementService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
