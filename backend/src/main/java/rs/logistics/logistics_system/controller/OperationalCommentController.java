package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.OperationalCommentCreate;
import rs.logistics.logistics_system.dto.response.OperationalCommentResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.service.definition.OperationalCommentServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/operational-comments")
@RequiredArgsConstructor
public class OperationalCommentController {

    private final OperationalCommentServiceDefinition commentService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','WORKER')")
    @PostMapping
    public ResponseEntity<OperationalCommentResponse> create(@Valid @RequestBody OperationalCommentCreate dto) {
        return new ResponseEntity<>(commentService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping
    public ResponseEntity<List<OperationalCommentResponse>> getForEntity(@RequestParam OperationalEntityType entityType, @RequestParam Long entityId) {
        return ResponseEntity.ok(commentService.getForEntity(entityType, entityId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','WORKER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
