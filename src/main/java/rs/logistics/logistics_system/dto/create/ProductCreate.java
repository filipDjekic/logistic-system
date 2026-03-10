package rs.logistics.logistics_system.dto.create;

import rs.logistics.logistics_system.enums.ProductUnit;

import java.math.BigDecimal;

public class ProductCreate {

    private String name;
    private String description;
    private String sku;
    private ProductUnit unit;
    private BigDecimal price;
    private Boolean fragile;
    private BigDecimal weight;

    public ProductCreate() {}

    public ProductCreate(String name,
                         String description,
                         String sku,
                         ProductUnit unit,
                         BigDecimal price,
                         Boolean fragile,
                         BigDecimal weight) {
        this.name = name;
        this.description = description;
        this.sku = sku;
        this.unit = unit;
        this.price = price;
        this.fragile = fragile;
        this.weight = weight;
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
