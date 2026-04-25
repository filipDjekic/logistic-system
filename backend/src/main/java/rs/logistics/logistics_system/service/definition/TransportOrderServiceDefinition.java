package rs.logistics.logistics_system.service.definition;

import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

public interface TransportOrderServiceDefinition {

    TransportOrderResponse create(TransportOrderCreate dto);

    TransportOrderResponse update(Long id, TransportOrderUpdate dto);

    TransportOrderResponse getById(Long id);

    PageResponse<TransportOrderResponse> getAll(Pageable pageable);

    PageResponse<TransportOrderResponse> getAll(
            TransportOrderStatus status,
            PriorityLevel priority,
            Long sourceWarehouseId,
            Long destinationWarehouseId,
            Long vehicleId,
            Long assignedEmployeeId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String search,
            Pageable pageable
    );

    void delete(Long id);

    TransportOrderResponse changeStatus(Long id, TransportOrderStatus status);
}
