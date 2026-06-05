package rs.logistics.logistics_system.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AllowedStatusTransitionsResponse {
    private String currentStatus;
    private List<String> allowedStatuses;
    private Long currentVersion;

    public AllowedStatusTransitionsResponse(String currentStatus, List<String> allowedStatuses) {
        this.currentStatus = currentStatus;
        this.allowedStatuses = allowedStatuses;
    }
}
