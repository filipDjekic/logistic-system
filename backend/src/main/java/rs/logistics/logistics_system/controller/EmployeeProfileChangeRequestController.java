package rs.logistics.logistics_system.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.EmployeeProfileChangeRequestResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.update.EmployeeProfileChangeRequestReview;
import rs.logistics.logistics_system.enums.EmployeeProfileChangeRequestStatus;
import rs.logistics.logistics_system.service.definition.EmployeeProfileChangeRequestServiceDefinition;

@RestController
@RequestMapping("/api/employee-profile-change-requests")
@RequiredArgsConstructor
public class EmployeeProfileChangeRequestController {

    private final EmployeeProfileChangeRequestServiceDefinition service;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @GetMapping
    public ResponseEntity<PageResponse<EmployeeProfileChangeRequestResponse>> getAll(
            @RequestParam(required = false) EmployeeProfileChangeRequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(service.getReviewRequests(status, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeProfileChangeRequestResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getReviewRequestById(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<EmployeeProfileChangeRequestResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(service.approveReviewRequest(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @PatchMapping("/{id}/reject")
    public ResponseEntity<EmployeeProfileChangeRequestResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeProfileChangeRequestReview dto
    ) {
        return ResponseEntity.ok(service.rejectReviewRequest(id, dto));
    }
}
