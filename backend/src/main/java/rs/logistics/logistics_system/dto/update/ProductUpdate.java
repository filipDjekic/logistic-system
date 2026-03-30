package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ProductUnit;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class ProductUpdate {

    private Long id;

    @NotBlank
    @Size(min = 1, max = 100)
    private String name;

    @Size(min = 1, max = 255)
    private String description;

    @NotBlank
    @Size(min = 1, max = 50)
    private String sku;

    @NotBlank
    @Size(min = 1, max = 20)
    private ProductUnit unit;

    @NotNull
    @Positive
    private BigDecimal price;

    @NotNull
    private Boolean fragile;

    @NotNull
    @Positive
    private BigDecimal weight;

    public ProductUpdate(
            Long id,
            String name,
                           String description,
                           String sku,
                           ProductUnit unit,
                           BigDecimal price,
                           Boolean fragile,
                           BigDecimal weight) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.sku = sku;
        this.unit = unit;
        this.price = price;
        this.fragile = fragile;
        this.weight = weight;
    }
}
