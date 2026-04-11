package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;
import rs.logistics.logistics_system.service.definition.TransportOrderItemServiceDefinition;

@PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER')")
@RestController
@RequestMapping("/api/transport_order_items")
@RequiredArgsConstructor
public class TransportOrderItemController {

    private final TransportOrderItemServiceDefinition transportOrderItemService;

    @PostMapping
    public ResponseEntity<TransportOrderItemResponse> createTransportOrderItem(@Valid @RequestBody TransportOrderItemCreate dto) {
        TransportOrderItemResponse response = transportOrderItemService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransportOrderItemResponse> updateTransportOrderItem(@PathVariable Long id,@Valid @RequestBody TransportOrderItemUpdate dto) {
        TransportOrderItemResponse response = transportOrderItemService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransportOrderItemResponse> getTransportOrderItem(@PathVariable Long id) {
        TransportOrderItemResponse response = transportOrderItemService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<TransportOrderItemResponse>> getAllTransportOrderItems() {
        List<TransportOrderItemResponse> response = transportOrderItemService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransportOrderItem(@PathVariable Long id) {
        transportOrderItemService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
