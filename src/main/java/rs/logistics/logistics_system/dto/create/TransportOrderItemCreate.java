package rs.logistics.logistics_system.dto.create;

import java.math.BigDecimal;

public class TransportOrderItemCreate {

    private BigDecimal quantity;
    private BigDecimal weight;
    private String note;

    private Long transportOrderId;
    private Long productId;

    public TransportOrderItemCreate() {}

    public TransportOrderItemCreate(BigDecimal quantity, BigDecimal weight, String note, Long transportOrderId, Long productId) {
        this.quantity = quantity;
        this.weight = weight;
        this.note = note;
        this.transportOrderId = transportOrderId;
        this.productId = productId;
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
