package rs.logistics.logistics_system.dto.update;

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

    private String name;
    private String description;
    private String sku;
    private ProductUnit unit;
    private BigDecimal price;
    private Boolean fragile;
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
