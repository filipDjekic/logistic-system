package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.OperationalAttachmentCreate;
import rs.logistics.logistics_system.dto.response.OperationalAttachmentResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.service.definition.OperationalAttachmentServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/operational-attachments")
@RequiredArgsConstructor
public class OperationalAttachmentController {

    private final OperationalAttachmentServiceDefinition attachmentService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @PostMapping
    public ResponseEntity<OperationalAttachmentResponse> create(@Valid @RequestBody OperationalAttachmentCreate dto) {
        return new ResponseEntity<>(attachmentService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping
    public ResponseEntity<List<OperationalAttachmentResponse>> getForEntity(@RequestParam OperationalEntityType entityType, @RequestParam Long entityId) {
        return ResponseEntity.ok(attachmentService.getForEntity(entityType, entityId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        attachmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
