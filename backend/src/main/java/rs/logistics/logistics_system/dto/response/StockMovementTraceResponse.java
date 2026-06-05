package rs.logistics.logistics_system.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementTraceResponse {

    private Long movementId;
    private Long rootMovementId;
    private Long parentMovementId;
    private String transferGroupId;
    private String sourceType;
    private Long sourceId;
    private String referenceCode;
    private List<StockMovementResponse> movements;
}
