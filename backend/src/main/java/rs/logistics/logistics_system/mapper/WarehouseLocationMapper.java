package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.*;
import rs.logistics.logistics_system.entity.*;

public class WarehouseLocationMapper {
    public static WarehouseZoneResponse toZoneResponse(WarehouseZone z) {
        WarehouseZoneResponse r = new WarehouseZoneResponse();
        r.setId(z.getId()); r.setWarehouseId(z.getWarehouse().getId()); r.setWarehouseName(z.getWarehouse().getName());
        r.setCompanyId(z.getWarehouse().getCompany().getId()); r.setCode(z.getCode()); r.setName(z.getName());
        r.setType(z.getType()); r.setCapacity(z.getCapacity()); r.setActive(z.getActive()); r.setDescription(z.getDescription());
        r.setCreatedAt(z.getCreatedAt()); r.setUpdatedAt(z.getUpdatedAt()); return r;
    }
    public static BinLocationResponse toBinResponse(BinLocation b) {
        BinLocationResponse r = new BinLocationResponse();
        r.setId(b.getId()); r.setWarehouseId(b.getWarehouse().getId()); r.setWarehouseName(b.getWarehouse().getName());
        r.setZoneId(b.getZone().getId()); r.setZoneCode(b.getZone().getCode()); r.setZoneName(b.getZone().getName()); r.setZoneType(b.getZone().getType());
        r.setCompanyId(b.getWarehouse().getCompany().getId()); r.setCode(b.getCode()); r.setName(b.getName()); r.setCapacity(b.getCapacity()); r.setActive(b.getActive()); r.setDescription(b.getDescription());
        r.setCreatedAt(b.getCreatedAt()); r.setUpdatedAt(b.getUpdatedAt()); return r;
    }
    public static BinInventoryResponse toBinInventoryResponse(BinInventory bi) {
        BinLocation b = bi.getBinLocation(); Product p = bi.getProduct();
        BinInventoryResponse r = new BinInventoryResponse();
        r.setBinLocationId(b.getId()); r.setBinLocationCode(b.getCode()); r.setBinLocationName(b.getName());
        r.setWarehouseId(b.getWarehouse().getId()); r.setWarehouseName(b.getWarehouse().getName());
        r.setZoneId(b.getZone().getId()); r.setZoneCode(b.getZone().getCode());
        r.setProductId(p.getId()); r.setProductName(p.getName()); r.setSku(p.getSku()); r.setQuantity(bi.getQuantity()); r.setLastUpdated(bi.getLastUpdated()); return r;
    }
    public static InternalWarehouseMovementResponse toMovementResponse(InternalWarehouseMovement m) {
        InternalWarehouseMovementResponse r = new InternalWarehouseMovementResponse();
        r.setId(m.getId()); r.setWarehouseId(m.getWarehouse().getId()); r.setWarehouseName(m.getWarehouse().getName());
        r.setProductId(m.getProduct().getId()); r.setProductName(m.getProduct().getName()); r.setSku(m.getProduct().getSku());
        r.setSourceBinId(m.getSourceBin().getId()); r.setSourceBinCode(m.getSourceBin().getCode()); r.setSourceBinZoneId(m.getSourceBin().getZone().getId());
        r.setDestinationBinId(m.getDestinationBin().getId()); r.setDestinationBinCode(m.getDestinationBin().getCode()); r.setDestinationBinZoneId(m.getDestinationBin().getZone().getId());
        r.setQuantity(m.getQuantity()); r.setStatus(m.getStatus()); r.setNote(m.getNote());
        r.setCreatedById(m.getCreatedBy() != null ? m.getCreatedBy().getId() : null); r.setCreatedByEmail(m.getCreatedBy() != null ? m.getCreatedBy().getEmail() : null);
        r.setCreatedAt(m.getCreatedAt()); return r;
    }
}
