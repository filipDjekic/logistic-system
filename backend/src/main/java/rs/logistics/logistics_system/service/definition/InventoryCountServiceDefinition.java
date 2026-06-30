package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.InventoryCountSessionCreate;
import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.response.InventoryCountLineResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionSummaryResponse;
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.update.InventoryCountLineUpdate;

import java.util.List;

public interface InventoryCountServiceDefinition {
    InventoryCountSessionResponse create(InventoryCountSessionCreate dto);
    List<InventoryCountSessionSummaryResponse> getAll(Long warehouseId);
    InventoryCountSessionResponse getById(Long id);
    PageResponse<InventoryCountLineResponse> getLines(Long id, String search, Long zoneId, Long binLocationId, String status, Pageable pageable);
    InventoryCountSessionResponse open(Long id);
    InventoryCountSessionResponse start(Long id);
    InventoryCountSessionResponse updateLine(Long sessionId, Long lineId, InventoryCountLineUpdate dto);
    InventoryCountSessionResponse submitReview(Long id);
    InventoryCountSessionResponse approve(Long id);
    InventoryCountSessionResponse reject(Long id);
    InventoryCountSessionResponse createAdjustments(Long id);
    InventoryCountSessionResponse close(Long id);
    InventoryCountSessionResponse cancel(Long id);
    AllowedStatusTransitionsResponse allowedStatusTransitions(Long id);
}
