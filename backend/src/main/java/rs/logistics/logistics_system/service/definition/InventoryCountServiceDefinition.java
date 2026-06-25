package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.InventoryCountSessionCreate;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionResponse;
import rs.logistics.logistics_system.dto.update.InventoryCountLineUpdate;

import java.util.List;

public interface InventoryCountServiceDefinition {
    InventoryCountSessionResponse create(InventoryCountSessionCreate dto);
    List<InventoryCountSessionResponse> getAll(Long warehouseId);
    InventoryCountSessionResponse getById(Long id);
    InventoryCountSessionResponse start(Long id);
    InventoryCountSessionResponse updateLine(Long sessionId, Long lineId, InventoryCountLineUpdate dto);
    InventoryCountSessionResponse submitReview(Long id);
    InventoryCountSessionResponse createAdjustments(Long id);
    InventoryCountSessionResponse cancel(Long id);
}
