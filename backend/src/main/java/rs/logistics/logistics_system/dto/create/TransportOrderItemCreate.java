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
public class TransportOrderItemCreate {

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

    public TransportOrderItemCreate(BigDecimal quantity, BigDecimal weight, String note, Long transportOrderId, Long productId) {
        this.quantity = quantity;
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
    }
}
