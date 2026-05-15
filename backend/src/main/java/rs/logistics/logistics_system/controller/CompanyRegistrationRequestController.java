package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.CompanyRegistrationReject;
import rs.logistics.logistics_system.dto.create.CompanyRegistrationRequestCreate;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationRequestResponse;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationValidationResponse;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationPublicStatusResponse;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;
import rs.logistics.logistics_system.service.definition.CompanyRegistrationRequestServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/company-registration-requests")
@RequiredArgsConstructor
public class CompanyRegistrationRequestController {

    private final CompanyRegistrationRequestServiceDefinition registrationRequestService;

    @PostMapping
    public ResponseEntity<CompanyRegistrationRequestResponse> submit(@Valid @RequestBody CompanyRegistrationRequestCreate dto) {
        return new ResponseEntity<>(registrationRequestService.submit(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping
    public ResponseEntity<List<CompanyRegistrationRequestResponse>> getAll(@RequestParam(required = false) CompanyRegistrationRequestStatus status) {
        return ResponseEntity.ok(registrationRequestService.getAll(status));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<CompanyRegistrationPublicStatusResponse> getPublicStatus(@PathVariable Long id) {
        return ResponseEntity.ok(registrationRequestService.getPublicStatus(id));
    }

    @GetMapping("/validate")
    public ResponseEntity<CompanyRegistrationValidationResponse> validateAvailability(
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String registrationNumber,
            @RequestParam(required = false) String taxNumber,
            @RequestParam(required = false) String adminEmail
    ) {
        return ResponseEntity.ok(registrationRequestService.validateAvailability(companyName, registrationNumber, taxNumber, adminEmail));
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping("/{id}")
    public ResponseEntity<CompanyRegistrationRequestResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(registrationRequestService.getById(id));
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @PostMapping("/{id}/under-review")
    public ResponseEntity<CompanyRegistrationRequestResponse> markUnderReview(@PathVariable Long id) {
        return ResponseEntity.ok(registrationRequestService.markUnderReview(id));
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<CompanyRegistrationRequestResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(registrationRequestService.approve(id));
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<CompanyRegistrationRequestResponse> reject(@PathVariable Long id, @Valid @RequestBody CompanyRegistrationReject dto) {
        return ResponseEntity.ok(registrationRequestService.reject(id, dto));
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<CompanyRegistrationRequestResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(registrationRequestService.cancel(id));
    }
}
