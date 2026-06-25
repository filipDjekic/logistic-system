package rs.logistics.logistics_system.dto.create;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockMovementDiscrepancyReason;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementCreate {

    @NotNull
    private StockMovementType movementType;

    @NotNull
    @Positive
    private BigDecimal quantity;

    @Positive
    private BigDecimal expectedQuantity;

    @Positive
    private BigDecimal actualQuantity;

    private StockMovementDiscrepancyReason discrepancyReason;

    @Size(max = 255)
    private String discrepancyNote;

    @Size(max = 100)
    private String batchLotNumber;

    private LocalDate batchExpirationDate;

    private List<@Size(max = 100) String> serialNumbers;
    @PositiveOrZero
    private BigDecimal unitCost;

    @PositiveOrZero
    private BigDecimal totalCost;

    @Size(min = 3, max = 3)
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a three-letter ISO code")
    private String currency;


    @NotNull
    private StockMovementReasonCode reasonCode;

    @Size(max = 255)
    private String reasonDescription;

    @NotNull
    private StockMovementReferenceType referenceType;

    @Positive
    private Long referenceId;

    @Size(max = 100)
    private String referenceNumber;

    @Size(max = 255)
    private String referenceNote;

    @Positive
    private Long transportOrderId;

    @NotNull
    @Positive
    private Long warehouseId;

    @NotNull
    @Positive
    private Long productId;

    public StockMovementCreate(
            StockMovementType movementType,
            BigDecimal quantity,
            StockMovementReasonCode reasonCode,
            String reasonDescription,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String referenceNumber,
            String referenceNote,
            BigDecimal unitCost,
            BigDecimal totalCost,
            String currency,
            Long transportOrderId,
            Long warehouseId,
            Long productId
    ) {
        this.movementType = movementType;
        this.quantity = quantity;
        this.reasonCode = reasonCode;
        this.reasonDescription = reasonDescription;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.referenceNumber = referenceNumber;
        this.referenceNote = referenceNote;
        this.unitCost = unitCost;
        this.totalCost = totalCost;
        this.currency = currency;
        this.transportOrderId = transportOrderId;
        this.warehouseId = warehouseId;
        this.productId = productId;
    }
}