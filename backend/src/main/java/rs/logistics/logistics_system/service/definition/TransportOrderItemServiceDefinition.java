package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;

public interface TransportOrderItemServiceDefinition {

    TransportOrderItemResponse create(TransportOrderItemCreate dto);

    TransportOrderItemResponse update(Long id, TransportOrderItemUpdate dto);

    TransportOrderItemResponse getById(Long id);

    PageResponse<TransportOrderItemResponse> getAll(Pageable pageable);

    PageResponse<TransportOrderItemResponse> getByTransportOrderId(Long transportOrderId, Pageable pageable);

    PageResponse<TransportOrderItemResponse> getByProductId(Long productId, Pageable pageable);

    void delete(Long id);
}
