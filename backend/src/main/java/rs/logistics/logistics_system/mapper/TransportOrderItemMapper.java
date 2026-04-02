package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.TransportOrderItem;

import java.math.BigDecimal;

public class TransportOrderItemMapper {

    public static TransportOrderItem toEntity(TransportOrderItemCreate dto, TransportOrder transportOrder, Product product) {
        return new TransportOrderItem(
                dto.getQuantity(),
                calculateWeight(product, dto.getQuantity()),
                dto.getNote(),
                transportOrder,
                product
        );
    }

    public static void updateEntity(TransportOrderItemUpdate dto, TransportOrderItem transportOrderItem, TransportOrder transportOrder, Product product) {
        transportOrderItem.setQuantity(dto.getQuantity());
        transportOrderItem.setWeight(calculateWeight(product, dto.getQuantity()));
        transportOrderItem.setNote(dto.getNote());
        transportOrderItem.setTransportOrder(transportOrder);
        transportOrderItem.setProduct(product);
    }

    public static TransportOrderItemResponse toResponse(TransportOrderItem transportOrderItem){
        return new TransportOrderItemResponse(
                transportOrderItem.getId(),
                transportOrderItem.getQuantity(),
                transportOrderItem.getWeight(),
                transportOrderItem.getNote(),
                transportOrderItem.getTransportOrder().getId(),
                transportOrderItem.getProduct().getId()
        );
    }

    private static BigDecimal calculateWeight(Product product, BigDecimal quantity) {
        if (product == null || product.getWeight() == null || product.getWeight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Product weight must be defined and greater than zero");
        }

        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Quantity must be greater than zero");
        }

        return product.getWeight().multiply(quantity);
    }
}