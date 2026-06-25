package rs.logistics.logistics_system.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.EmployeeProfileChangeRequestCreate;
import rs.logistics.logistics_system.dto.response.EmployeeProfileChangeRequestResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.ProfileResponse;
import rs.logistics.logistics_system.service.definition.EmployeeProfileChangeRequestServiceDefinition;
import rs.logistics.logistics_system.service.definition.ProfileServiceDefinition;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileServiceDefinition profileService;
    private final EmployeeProfileChangeRequestServiceDefinition employeeProfileChangeRequestService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<ProfileResponse> getCurrentProfile() {
        return ResponseEntity.ok(profileService.getCurrentProfile());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/change-requests")
    public ResponseEntity<PageResponse<EmployeeProfileChangeRequestResponse>> getCurrentUserChangeRequests(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(employeeProfileChangeRequestService.getCurrentUserRequests(pageable));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/change-requests/{id}")
    public ResponseEntity<EmployeeProfileChangeRequestResponse> getCurrentUserChangeRequest(@PathVariable Long id) {
        return ResponseEntity.ok(employeeProfileChangeRequestService.getCurrentUserRequestById(id));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/change-requests")
    public ResponseEntity<EmployeeProfileChangeRequestResponse> createCurrentUserChangeRequest(
            @Valid @RequestBody EmployeeProfileChangeRequestCreate dto
    ) {
        EmployeeProfileChangeRequestResponse response = employeeProfileChangeRequestService.createCurrentUserRequest(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/change-requests/{id}/cancel")
    public ResponseEntity<EmployeeProfileChangeRequestResponse> cancelCurrentUserChangeRequest(@PathVariable Long id) {
        return ResponseEntity.ok(employeeProfileChangeRequestService.cancelCurrentUserRequest(id));
    }
}
