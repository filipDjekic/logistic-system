package rs.logistics.logistics_system.dto.update;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TransportOrderItemUpdate {

    @NotNull
    @Positive
    private BigDecimal quantity;

    @Size(max = 255)
    private String note;

    @NotNull
    @Positive
    private Long transportOrderId;

    @NotNull
    @Positive
    private Long productId;

    @NotNull @PositiveOrZero @Digits(integer = 15, fraction = 4)
    private BigDecimal movementUnitCost;

    @NotNull @PositiveOrZero @Digits(integer = 15, fraction = 4)
    private BigDecimal movementTotalCost;

    @NotNull @Pattern(regexp = "^[A-Z]{3}$")
    private String movementCurrency;

}
