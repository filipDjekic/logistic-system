package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.service.definition.WarehouseServiceDefinition;

@PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseServiceDefinition warehouseService;

    @PostMapping
    public ResponseEntity<WarehouseResponse> createWarehouse(@Valid @RequestBody WarehouseCreate dto) {
        WarehouseResponse warehouseResponse = warehouseService.create(dto);
        return new ResponseEntity<>(warehouseResponse, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseResponse> update(@PathVariable Long id,@Valid @RequestBody WarehouseUpdate dto) {
        WarehouseResponse warehouseResponse = warehouseService.update(id, dto);
        return new ResponseEntity<>(warehouseResponse, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseResponse> getById(@PathVariable Long id) {
        WarehouseResponse warehouseResponse = warehouseService.getById(id);
        return new ResponseEntity<>(warehouseResponse, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<WarehouseResponse>> getAll() {
        List<WarehouseResponse> response = warehouseService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        warehouseService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/{id}/inventory")
    public ResponseEntity<List<WarehouseInventoryResponse>> getInventoryByWarehouse(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getInventoryByWarehouse(id));
    }

    @GetMapping("/{id}/outgoing-transports")
    public ResponseEntity<List<TransportOrderResponse>> getOutgoingTransports(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getOutgoingTransportOrders(id));
    }

    @GetMapping("/{id}/incoming-transports")
    public ResponseEntity<List<TransportOrderResponse>> getIncomingTransports(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getIncomingTransportOrders(id));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<WarehouseResponse>> getByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(warehouseService.getByManager(managerId));
    }

    @PatchMapping("/manager/assign")
    public ResponseEntity<Void> assignEmployee(@RequestParam Long employeeId, @RequestParam Long warehouseId){
        warehouseService.assignEmployee(employeeId, warehouseId);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PatchMapping("/warehouse/change-status")
    public ResponseEntity<WarehouseResponse> changeWarehouseStatus(@RequestParam Long id, @RequestParam WarehouseStatus status) {
        WarehouseResponse response = warehouseService.changeStatus(id, status);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
