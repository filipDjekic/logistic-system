package rs.logistics.logistics_system.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCountSessionResponse {
    private Long id;
    private String code;
    private String description;
    private InventoryCountSessionStatus status;
    private Long warehouseId;
    private String warehouseName;
    private Long createdById;
    private Long reviewedById;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int lineCount;
    private int countedLineCount;
    private int discrepancyLineCount;
    private List<InventoryCountLineResponse> lines;
}
