package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class StockReturnCreate {
    @NotNull @Positive
    private BigDecimal quantity;

    @Positive
    private BigDecimal expectedQuantity;
    @Positive
    private BigDecimal actualQuantity;
    private rs.logistics.logistics_system.enums.StockMovementDiscrepancyReason discrepancyReason;
    @Size(max = 255)
    private String discrepancyNote;

    @Size(max = 100)
    private String batchLotNumber;

    private LocalDate batchExpirationDate;

    private List<@Size(max = 100) String> serialNumbers;
    @Size(max = 255)
    private String reasonDescription;
    @Size(max = 100)
    private String referenceNumber;
    @Size(max = 255)
    private String referenceNote;
    @Positive
    private Long referenceId;
    @NotNull @Positive
    private Long warehouseId;
    @NotNull @Positive
    private Long productId;
    @Positive
    private Long binLocationId;
}
