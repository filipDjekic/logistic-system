package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class BinInventoryCreate {
    @NotNull @Positive
    private Long binLocationId;
    @NotNull @Positive
    private Long productId;
    @NotNull @Positive
    private BigDecimal quantity;
}
