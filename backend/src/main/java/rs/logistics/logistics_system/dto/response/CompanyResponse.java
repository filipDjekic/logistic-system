package rs.logistics.logistics_system.dto.response;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CompanyResponse {

    private Long id;
    private String name;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long adminUserId;
    private Long adminEmployeeId;
    private String adminFullName;
    private String adminEmail;

    public CompanyResponse(
            Long id,
            String name,
            Boolean active,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            Long adminUserId,
            Long adminEmployeeId,
            String adminFullName,
            String adminEmail
    ) {
        this.id = id;
        this.name = name;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.adminUserId = adminUserId;
        this.adminEmployeeId = adminEmployeeId;
        this.adminFullName = adminFullName;
        this.adminEmail = adminEmail;
    }
}
