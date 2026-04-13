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

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseServiceDefinition warehouseService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PostMapping
    public ResponseEntity<WarehouseResponse> createWarehouse(@Valid @RequestBody WarehouseCreate dto) {
        return new ResponseEntity<>(warehouseService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<WarehouseResponse> update(@PathVariable Long id, @Valid @RequestBody WarehouseUpdate dto) {
        return new ResponseEntity<>(warehouseService.update(id, dto), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/{id}")
    public ResponseEntity<WarehouseResponse> getById(@PathVariable Long id) {
        return new ResponseEntity<>(warehouseService.getById(id), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping
    public ResponseEntity<List<WarehouseResponse>> getAll() {
        return new ResponseEntity<>(warehouseService.getAll(), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        warehouseService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/{id}/inventory")
    public ResponseEntity<List<WarehouseInventoryResponse>> getInventoryByWarehouse(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getInventoryByWarehouse(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/{id}/outgoing-transports")
    public ResponseEntity<List<TransportOrderResponse>> getOutgoingTransports(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getOutgoingTransportOrders(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/{id}/incoming-transports")
    public ResponseEntity<List<TransportOrderResponse>> getIncomingTransports(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getIncomingTransportOrders(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<WarehouseResponse>> getByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(warehouseService.getByManager(managerId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PatchMapping("/manager/assign")
    public ResponseEntity<WarehouseResponse> assignEmployee(@RequestParam Long employeeId, @RequestParam Long warehouseId){
        return ResponseEntity.ok(warehouseService.assignEmployee(warehouseId, employeeId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PatchMapping("/warehouse/change-status")
    public ResponseEntity<WarehouseResponse> changeWarehouseStatus(@RequestParam Long id, @RequestParam WarehouseStatus status) {
        return new ResponseEntity<>(warehouseService.changeStatus(id, status), HttpStatus.OK);
    }
}