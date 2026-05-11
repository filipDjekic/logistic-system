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
public class InternalWarehouseMovementCreate {
    @NotNull @Positive
    private Long sourceBinId;
    @NotNull @Positive
    private Long destinationBinId;
    @NotNull @Positive
    private Long productId;
    @NotNull @Positive
    private BigDecimal quantity;
    @Size(max = 500)
    private String note;
}
