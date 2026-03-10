package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.TransportOrderItem;

public class TransportOrderItemMapper {

    public static TransportOrderItem toEntity(TransportOrderItemCreate dto, TransportOrder transportOrder, Product product) {
        TransportOrderItem transportOrderItem = new TransportOrderItem(
                dto.getQuantity(),
                dto.getWeight(),
                dto.getNote(),
                transportOrder,
                product
        );
        return transportOrderItem;
    }

    public static void updateEntity(TransportOrderItemCreate dto, TransportOrderItem transportOrderItem, TransportOrder transportOrder, Product product) {
        transportOrderItem.setQuantity(dto.getQuantity());
        transportOrderItem.setWeight(dto.getWeight());
        transportOrderItem.setNote(dto.getNote());
        transportOrderItem.setTransportOrder(transportOrder);
        transportOrderItem.setProduct(product);
    }

    public static TransportOrderItemResponse toResponse(TransportOrderItem transportOrderItem){
        TransportOrderItemResponse transportOrderItemResponse = new TransportOrderItemResponse(
                transportOrderItem.getId(),
                transportOrderItem.getQuantity(),
                transportOrderItem.getWeight(),
                transportOrderItem.getNote(),
                transportOrderItem.getTransportOrder().getId(),
                transportOrderItem.getProduct().getId()
        );
        return transportOrderItemResponse;
    }
}
