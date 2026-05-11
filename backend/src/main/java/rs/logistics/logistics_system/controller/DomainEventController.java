package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.DomainEventCreate;
import rs.logistics.logistics_system.dto.response.DomainEventResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/domain-events")
@RequiredArgsConstructor
public class DomainEventController {

    private final DomainEventServiceDefinition domainEventService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PostMapping
    public ResponseEntity<DomainEventResponse> create(@Valid @RequestBody DomainEventCreate dto) {
        return new ResponseEntity<>(domainEventService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping
    public ResponseEntity<List<DomainEventResponse>> getForEntity(@RequestParam OperationalEntityType entityType, @RequestParam Long entityId) {
        return ResponseEntity.ok(domainEventService.getForEntity(entityType, entityId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping("/recent")
    public ResponseEntity<List<DomainEventResponse>> getRecent() {
        return ResponseEntity.ok(domainEventService.getRecent());
    }
}
