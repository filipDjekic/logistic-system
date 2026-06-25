package rs.logistics.logistics_system.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeeProfileChangeRequestStatus;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeProfileChangeRequestResponse {

    private Long id;

    private Long employeeId;
    private String employeeFullName;

    private Long requestedByUserId;
    private String requestedByFullName;

    private Long companyId;
    private String companyName;

    private EmployeeProfileChangeRequestStatus status;
    private Map<String, Object> requestedChanges;
    private String reason;

    private Long reviewedByUserId;
    private String reviewedByFullName;
    private LocalDateTime reviewedAt;
    private String rejectionReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;
}
