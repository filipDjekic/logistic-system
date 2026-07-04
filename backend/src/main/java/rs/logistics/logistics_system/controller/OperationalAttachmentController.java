package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import rs.logistics.logistics_system.dto.create.OperationalAttachmentCreate;
import rs.logistics.logistics_system.dto.response.OperationalAttachmentResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.OperationalAttachmentType;
import rs.logistics.logistics_system.service.definition.OperationalAttachmentServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/operational-attachments")
@RequiredArgsConstructor
public class OperationalAttachmentController {

    private final OperationalAttachmentServiceDefinition attachmentService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @PostMapping
    public ResponseEntity<OperationalAttachmentResponse> create(@Valid @RequestBody OperationalAttachmentCreate dto) {
        return new ResponseEntity<>(attachmentService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OperationalAttachmentResponse> upload(
            @RequestParam OperationalEntityType entityType,
            @RequestParam Long entityId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "DOCUMENT") OperationalAttachmentType attachmentType,
            @RequestParam(required = false) String description
    ) {
        return new ResponseEntity<>(attachmentService.upload(entityType, entityId, file, attachmentType, description), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping
    public ResponseEntity<List<OperationalAttachmentResponse>> getForEntity(@RequestParam OperationalEntityType entityType, @RequestParam Long entityId) {
        return ResponseEntity.ok(attachmentService.getForEntity(entityType, entityId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        OperationalAttachmentResponse attachment = attachmentService.getById(id);
        Resource resource = attachmentService.download(id);
        String fileName = attachment.getFileName() == null ? "attachment" : attachment.getFileName().replace("\"", "");
        MediaType mediaType = attachment.getContentType() == null || attachment.getContentType().isBlank()
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(attachment.getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        attachmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
