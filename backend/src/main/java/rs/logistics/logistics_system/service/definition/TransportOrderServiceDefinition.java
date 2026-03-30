package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.util.List;

public interface TransportOrderServiceDefinition {

    TransportOrderResponse create(TransportOrderCreate dto);

    TransportOrderResponse update(Long id, TransportOrderUpdate dto);

    TransportOrderResponse getById(Long id);

    List<TransportOrderResponse> getAll();

    void delete(Long id);

    TransportOrderResponse changeStatus(Long id, TransportOrderStatus status);
}
