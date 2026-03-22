package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.StockMovementUpdate;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
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
