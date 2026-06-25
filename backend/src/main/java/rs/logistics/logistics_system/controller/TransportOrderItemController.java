package rs.logistics.logistics_system.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;
import rs.logistics.logistics_system.service.definition.TransportOrderItemServiceDefinition;

@RestController
@RequestMapping({"/api/transport_order_items", "/api/transport-order-items"})
@RequiredArgsConstructor
public class TransportOrderItemController {

    private final TransportOrderItemServiceDefinition transportOrderItemService;

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER')")
    @PostMapping
    public ResponseEntity<TransportOrderItemResponse> createTransportOrderItem(@Valid @RequestBody TransportOrderItemCreate dto) {
        TransportOrderItemResponse response = transportOrderItemService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER')")
    @PutMapping("/{id}")
    public ResponseEntity<TransportOrderItemResponse> updateTransportOrderItem(@PathVariable Long id,@Valid @RequestBody TransportOrderItemUpdate dto) {
        TransportOrderItemResponse response = transportOrderItemService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<TransportOrderItemResponse> getTransportOrderItem(@PathVariable Long id) {
        TransportOrderItemResponse response = transportOrderItemService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping
    public ResponseEntity<PageResponse<TransportOrderItemResponse>> getAllTransportOrderItems(
            @RequestParam(required = false) Long transportOrderId,
            @RequestParam(required = false) Long productId,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<TransportOrderItemResponse> response;

        if (transportOrderId != null) {
            response = transportOrderItemService.getByTransportOrderId(transportOrderId, pageable);
        } else if (productId != null) {
            response = transportOrderItemService.getByProductId(productId, pageable);
        } else {
            response = transportOrderItemService.getAll(pageable);
        }

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransportOrderItem(@PathVariable Long id) {
        transportOrderItemService.delete(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
