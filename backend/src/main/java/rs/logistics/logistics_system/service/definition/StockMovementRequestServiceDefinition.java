package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.create.StockMovementRequestCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementRequestResponse;
import rs.logistics.logistics_system.dto.update.StockMovementRequestReview;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;

public interface StockMovementRequestServiceDefinition {
    StockMovementRequestResponse create(StockMovementRequestCreate dto);
    PageResponse<StockMovementRequestResponse> search(StockMovementRequestStatus status, Pageable pageable);
    StockMovementRequestResponse getById(Long id);
    StockMovementRequestResponse approve(Long id, StockMovementRequestReview review);
    StockMovementRequestResponse reject(Long id, StockMovementRequestReview review);
    StockMovementRequestResponse cancel(Long id, StockMovementRequestReview review);
}
