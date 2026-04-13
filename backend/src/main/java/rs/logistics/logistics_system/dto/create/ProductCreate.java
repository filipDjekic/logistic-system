package rs.logistics.logistics_system.dto.create;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ProductUnit;

@Getter
@Setter
@NoArgsConstructor
public class ProductCreate {

    @NotBlank
    @Size(min = 1, max = 100)
    private String name;

    @Size(max = 255)
    private String description;

    @NotBlank
    @Size(min = 1, max = 50)
    private String sku;

    @NotNull
    private ProductUnit unit;

    @NotNull
    @Positive
    private BigDecimal price;

    @NotNull
    private Boolean fragile;

    @NotNull
    @Positive
    private BigDecimal weight;

    @Positive
    private Long companyId;

    public ProductCreate(String name,
                         String description,
                         String sku,
                         ProductUnit unit,
                         BigDecimal price,
                         Boolean fragile,
                         BigDecimal weight,
                         Long companyId) {
        this.name = name;
        this.description = description;
        this.sku = sku;
        this.unit = unit;
        this.price = price;
        this.fragile = fragile;
        this.weight = weight;
        this.companyId = companyId;
    }
}