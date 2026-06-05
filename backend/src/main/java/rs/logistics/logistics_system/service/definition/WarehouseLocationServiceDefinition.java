package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import rs.logistics.logistics_system.enums.WarehouseZoneType;
import rs.logistics.logistics_system.dto.create.*;
import rs.logistics.logistics_system.dto.response.*;
import rs.logistics.logistics_system.dto.update.*;

public interface WarehouseLocationServiceDefinition {
    WarehouseZoneResponse createZone(WarehouseZoneCreate dto);
    WarehouseZoneResponse updateZone(Long id, WarehouseZoneUpdate dto);
    WarehouseZoneResponse getZone(Long id);
    PageResponse<WarehouseZoneResponse> searchZones(Long warehouseId, Boolean active, WarehouseZoneType type, String search, Pageable pageable);
    void deleteZone(Long id);
    BinLocationResponse createBin(BinLocationCreate dto);
    BinLocationResponse updateBin(Long id, BinLocationUpdate dto);
    BinLocationResponse getBin(Long id);
    PageResponse<BinLocationResponse> searchBins(Long warehouseId, Long zoneId, Boolean active, WarehouseZoneType type, String search, Pageable pageable);
    void deleteBin(Long id);
    BinInventoryResponse setBinInventory(BinInventoryCreate dto);
    PageResponse<BinInventoryResponse> searchBinInventory(Long warehouseId, Long zoneId, Long binLocationId, Long productId, BigDecimal quantityMin, BigDecimal quantityMax, Boolean reserved, Boolean available, String search, Pageable pageable);
    InternalWarehouseMovementResponse moveInternal(InternalWarehouseMovementCreate dto);
    PageResponse<InternalWarehouseMovementResponse> searchInternalMovements(Long warehouseId, Long productId, Long zoneId, Long binLocationId, String search, Pageable pageable);
}
