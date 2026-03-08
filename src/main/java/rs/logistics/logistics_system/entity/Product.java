package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ProductUnit;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PRODUCTS")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false, length = 20)
    private ProductUnit unit;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "fragile", nullable = false)
    private Boolean fragile;

    @Column(name = "weight", nullable = false, precision = 12, scale = 2)
    private BigDecimal weight;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @OneToMany(mappedBy = "product")
    private List<WarehouseInventory> inventoryItems = new ArrayList<>();

    @OneToMany(mappedBy = "product")
    private List<StockMovement> stockMovements = new ArrayList<>();

    public Product(String name, String description, String sku, ProductUnit unit, BigDecimal price) {
        this.name = name;
        this.description = description;
        this.sku = sku;
        this.unit = unit;
        this.price = price;
        this.active = true;
    }
}
