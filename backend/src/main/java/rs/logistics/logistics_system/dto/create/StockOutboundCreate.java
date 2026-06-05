package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class StockOutboundCreate {
    @NotNull @Positive
    private BigDecimal quantity;
    @Size(max = 255)
    private String reasonDescription;
    @Size(max = 100)
    private String referenceNumber;
    @Size(max = 255)
    private String referenceNote;
    @Positive
    private Long referenceId;
    @Positive
    private Long transportOrderId;
    @NotNull @Positive
    private Long warehouseId;
    @NotNull @Positive
    private Long productId;
    @Positive
    private Long binLocationId;
}
