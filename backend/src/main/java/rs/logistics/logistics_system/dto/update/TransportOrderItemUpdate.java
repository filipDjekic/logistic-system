package rs.logistics.logistics_system.dto.update;

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
public class TransportOrderItemUpdate {

    private Long id;

    @NotNull
    @Positive
    private BigDecimal quantity;

    @NotNull
    @Positive
    private BigDecimal weight;

    @Size(min = 1, max = 255)
    private String note;

    @NotNull
    @Positive
    private Long transportOrderId;

    @NotNull
    @Positive
    private Long productId;

    public TransportOrderItemUpdate(Long id, BigDecimal quantity, BigDecimal weight, String note, Long transportOrderId, Long productId) {
        this.id = id;
        this.quantity = quantity;
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
    }
}
