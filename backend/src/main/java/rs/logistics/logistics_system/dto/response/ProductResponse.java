package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ProductUnit;

@Getter
@Setter
@NoArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String sku;
    private ProductUnit unit;
    private BigDecimal price;
    private Boolean fragile;
    private BigDecimal weight;
    private Boolean active;
    private Long companyId;
    private String companyName;

    public ProductResponse(
            Long id,
            String name,
            String description,
            String sku,
            ProductUnit unit,
            BigDecimal price,
            Boolean fragile,
            BigDecimal weight,
            Boolean active,
            Long companyId,
            String companyName
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.sku = sku;
        this.unit = unit;
        this.price = price;
        this.fragile = fragile;
        this.weight = weight;
        this.active = active;
        this.companyId = companyId;
        this.companyName = companyName;
    }
}