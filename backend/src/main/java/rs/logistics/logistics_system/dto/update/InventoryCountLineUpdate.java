package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class InventoryCountLineUpdate {
    @NotNull
    private Long expectedVersion;

    private Long binLocationId;

    @NotNull @PositiveOrZero
    private BigDecimal countedQuantity;
    @Size(max = 255)
    private String note;
}
