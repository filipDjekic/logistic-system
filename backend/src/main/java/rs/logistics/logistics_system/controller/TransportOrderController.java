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
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.statusUpdate.TransportOrderStatusUpdate;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.service.definition.TransportOrderServiceDefinition;

@RestController
@RequestMapping("/api/transport_orders")
@RequiredArgsConstructor
public class TransportOrderController {

    private final TransportOrderServiceDefinition transportOrderService;

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER')")
    @PostMapping
    public ResponseEntity<TransportOrderResponse> create(@Valid @RequestBody TransportOrderCreate dto){
        TransportOrderResponse response = transportOrderService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER')")
    @PutMapping("/{id}")
    public ResponseEntity<TransportOrderResponse> update(@PathVariable Long id,@Valid @RequestBody TransportOrderUpdate dto) {
        TransportOrderResponse response = transportOrderService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER','DRIVER')")
    @GetMapping("/{id}")
    public ResponseEntity<TransportOrderResponse> getById(@PathVariable Long id) {
        TransportOrderResponse response = transportOrderService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER','DRIVER')")
    @GetMapping
    public ResponseEntity<List<TransportOrderResponse>> getAll() {
        List<TransportOrderResponse> responses = transportOrderService.getAll();
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        transportOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER','DRIVER')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<TransportOrderResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody TransportOrderStatusUpdate dto) {
        TransportOrderResponse response = transportOrderService.changeStatus(id, dto.getStatus());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
