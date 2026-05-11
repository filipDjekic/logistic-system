package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.create.*;
import rs.logistics.logistics_system.dto.response.*;
import rs.logistics.logistics_system.dto.update.*;

public interface WarehouseLocationServiceDefinition {
    WarehouseZoneResponse createZone(WarehouseZoneCreate dto);
    WarehouseZoneResponse updateZone(Long id, WarehouseZoneUpdate dto);
    PageResponse<WarehouseZoneResponse> searchZones(Long warehouseId, Boolean active, String search, Pageable pageable);
    void deleteZone(Long id);
    BinLocationResponse createBin(BinLocationCreate dto);
    BinLocationResponse updateBin(Long id, BinLocationUpdate dto);
    PageResponse<BinLocationResponse> searchBins(Long warehouseId, Long zoneId, Boolean active, String search, Pageable pageable);
    void deleteBin(Long id);
    BinInventoryResponse setBinInventory(BinInventoryCreate dto);
    PageResponse<BinInventoryResponse> searchBinInventory(Long warehouseId, Long zoneId, Long binLocationId, Long productId, String search, Pageable pageable);
    InternalWarehouseMovementResponse moveInternal(InternalWarehouseMovementCreate dto);
    PageResponse<InternalWarehouseMovementResponse> searchInternalMovements(Long warehouseId, Long productId, Long binLocationId, String search, Pageable pageable);
}
