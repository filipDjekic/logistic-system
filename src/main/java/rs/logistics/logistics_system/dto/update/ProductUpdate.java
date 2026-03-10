package rs.logistics.logistics_system.dto.update;

import rs.logistics.logistics_system.enums.ProductUnit;

import java.math.BigDecimal;

public class ProductUpdate {

    private Long id;

    private String name;
    private String description;
    private String sku;
    private ProductUnit unit;
    private BigDecimal price;
    private Boolean fragile;
    private BigDecimal weight;

    public ProductUpdate() {}

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

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public String getSku() {
        return sku;
    }
    public void setSku(String sku) {
        this.sku = sku;
    }
    public ProductUnit getUnit() {
        return unit;
    }
    public void setUnit(ProductUnit unit) {
        this.unit = unit;
    }
    public BigDecimal getPrice() {
        return price;
    }
    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    public Boolean getFragile() {
        return fragile;
    }
    public void setFragile(Boolean fragile) {
        this.fragile = fragile;
    }
    public BigDecimal getWeight() {
        return weight;
    }
    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }
}
