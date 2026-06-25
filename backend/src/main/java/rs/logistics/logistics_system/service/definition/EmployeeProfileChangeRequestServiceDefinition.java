package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.create.EmployeeProfileChangeRequestCreate;
import rs.logistics.logistics_system.dto.response.EmployeeProfileChangeRequestResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.update.EmployeeProfileChangeRequestReview;
import rs.logistics.logistics_system.enums.EmployeeProfileChangeRequestStatus;

public interface EmployeeProfileChangeRequestServiceDefinition {

    EmployeeProfileChangeRequestResponse createCurrentUserRequest(EmployeeProfileChangeRequestCreate dto);

    PageResponse<EmployeeProfileChangeRequestResponse> getCurrentUserRequests(Pageable pageable);

    EmployeeProfileChangeRequestResponse getCurrentUserRequestById(Long id);

    EmployeeProfileChangeRequestResponse cancelCurrentUserRequest(Long id);

    PageResponse<EmployeeProfileChangeRequestResponse> getReviewRequests(EmployeeProfileChangeRequestStatus status, Pageable pageable);

    EmployeeProfileChangeRequestResponse getReviewRequestById(Long id);

    EmployeeProfileChangeRequestResponse approveReviewRequest(Long id);

    EmployeeProfileChangeRequestResponse rejectReviewRequest(Long id, EmployeeProfileChangeRequestReview dto);
}

