package rs.logistics.logistics_system.service.definition;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.create.StockAdjustmentCreate;
import rs.logistics.logistics_system.dto.create.StockInboundCreate;
import rs.logistics.logistics_system.dto.create.StockOutboundCreate;
import rs.logistics.logistics_system.dto.create.StockReturnCreate;
import rs.logistics.logistics_system.dto.create.StockTransferCreate;
import rs.logistics.logistics_system.dto.create.StockWriteOffCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.response.StockMovementTraceResponse;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementType;

public interface StockMovementServiceDefinition {

    StockMovementResponse inbound(StockInboundCreate dto);

    StockMovementResponse outbound(StockOutboundCreate dto);

    List<StockMovementResponse> transfer(StockTransferCreate dto);

    StockMovementResponse dispatchTransport(StockTransferCreate dto);

    StockMovementResponse receiveTransport(StockTransferCreate dto);

    StockMovementResponse returnFailedTransportToSource(StockTransferCreate dto);

    StockMovementResponse adjustment(StockAdjustmentCreate dto);

    StockMovementResponse writeOff(StockWriteOffCreate dto);

    StockMovementResponse returnStock(StockReturnCreate dto);

    StockMovementResponse getById(Long id);

    StockMovementTraceResponse trace(Long id);

    PageResponse<StockMovementResponse> getAll(Pageable pageable);

    PageResponse<StockMovementResponse> search(String search, StockMovementType movementType, StockMovementReasonCode reasonCode, Long warehouseId, Long productId, Long transportOrderId, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
}
