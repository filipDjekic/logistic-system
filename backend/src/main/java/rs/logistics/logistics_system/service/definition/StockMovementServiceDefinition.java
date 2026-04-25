package rs.logistics.logistics_system.service.definition;

import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.enums.StockMovementType;

public interface StockMovementServiceDefinition {

    StockMovementResponse create(StockMovementCreate dto);

    StockMovementResponse getById(Long id);

    PageResponse<StockMovementResponse> getAll(Pageable pageable);

    PageResponse<StockMovementResponse> search(String search, StockMovementType movementType, Long warehouseId, Long productId, Long transportOrderId, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
}
