package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;

import java.util.List;

public interface TransportOrderItemServiceDefinition {

    TransportOrderItemResponse create(TransportOrderItemCreate dto);

    TransportOrderItemResponse update(Long id, TransportOrderItemUpdate dto);

    TransportOrderItemResponse getById(Long id);

    List<TransportOrderItemResponse> getAll();

    void delete(Long id);
}
