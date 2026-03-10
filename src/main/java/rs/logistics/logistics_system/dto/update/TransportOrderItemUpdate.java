package rs.logistics.logistics_system.dto.update;

import java.math.BigDecimal;

public class TransportOrderItemUpdate {

    private Long id;

    private BigDecimal quantity;
    private BigDecimal weight;
    private String note;

    private Long transportOrderId;
    private Long productId;

    public TransportOrderItemUpdate() {}

    public TransportOrderItemUpdate(Long id, BigDecimal quantity, BigDecimal weight, String note, Long transportOrderId, Long productId) {
        this.id = id;
        this.quantity = quantity;
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public BigDecimal getQuantity() {
        return quantity;
    }
    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
    public BigDecimal getWeight() {
        return weight;
    }
    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }
    public String getNote() {
        return note;
    }
    public void setNote(String note) {
        this.note = note;
    }
    public Long getTransportOrderId() {
        return transportOrderId;
    }
    public void setTransportOrderId(Long transportOrderId) {
        this.transportOrderId = transportOrderId;
    }
    public Long getProductId() {
        return productId;
    }
    public void setProductId(Long productId) {
        this.productId = productId;
    }
}
