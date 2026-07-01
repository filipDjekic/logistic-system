package rs.logistics.logistics_system.dto.response;

import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

import java.time.LocalDateTime;

public record CompanyRegistrationPublicStatusResponse(
        String trackingToken,
        String companyName,
        CompanyRegistrationRequestStatus status,
        String statusLabel,
        String statusDescription,
        boolean terminal,
        LocalDateTime submittedAt,
        LocalDateTime reviewedAt,
        String rejectionReason
) {
}
