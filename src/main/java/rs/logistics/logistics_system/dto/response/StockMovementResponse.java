package rs.logistics.logistics_system.dto.response;

import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;

public class StockMovementResponse {

    private Long id;

    private StockMovementType movementType;
    private BigDecimal quantity;
    private String referenceNote;

    private Long warehouseId;
    private Long productId;
    private Long createdById;

    public StockMovementResponse() {}

    public StockMovementResponse(Long id, StockMovementType movementType,
                               BigDecimal quantity,
                               String referenceNote,
                               Long warehouseId, Long productId, Long createdById) {
        this.id = id;
        this.movementType = movementType;
        this.quantity = quantity;
        this.referenceNote = referenceNote;
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.createdById = createdById;
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public StockMovementType getMovementType() {
        return movementType;
    }
    public void setMovementType(StockMovementType movementType) {
        this.movementType = movementType;
    }
    public BigDecimal getQuantity() {
        return quantity;
    }
    public void setQuantity(BigDecimal price) {
        this.quantity = price;
    }
    public String getReferenceNote() {
        return referenceNote;
    }
    public void setReferenceNote(String referenceNote) {
        this.referenceNote = referenceNote;
    }
    public Long getWarehouseId() {
        return warehouseId;
    }
    public void setWarehouseId(Long warehouseId) {
        this.warehouseId = warehouseId;
    }
    public Long getProductId() {
        return productId;
    }
    public void setProductId(Long productId) {
        this.productId = productId;
    }
    public Long getCreatedById() {
        return createdById;
    }
    public void setCreatedById(Long createdById) {
        this.createdById = createdById;
    }
}
