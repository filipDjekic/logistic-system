package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.statusUpdate.TransportOrderStatusUpdate;
import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.service.definition.TransportOrderServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/transport_orders")
@RequiredArgsConstructor
public class TransportOrderController {

    private final TransportOrderServiceDefinition transportOrderService;

    @PostMapping
    public ResponseEntity<TransportOrderResponse> create(@Valid @RequestBody TransportOrderCreate dto){
        TransportOrderResponse response = transportOrderService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransportOrderResponse> update(@PathVariable Long id,@Valid @RequestBody TransportOrderUpdate dto) {
        TransportOrderResponse response = transportOrderService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransportOrderResponse> getById(@PathVariable Long id) {
        TransportOrderResponse response = transportOrderService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<TransportOrderResponse>> getAll() {
        List<TransportOrderResponse> responses = transportOrderService.getAll();
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        transportOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TransportOrderResponse> updateStatus(@PathVariable Long id, @RequestBody TransportOrderStatusUpdate dto) {
        TransportOrderResponse response = transportOrderService.changeStatus(id, dto.getStatus());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
