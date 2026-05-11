package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.*;
import rs.logistics.logistics_system.dto.response.*;
import rs.logistics.logistics_system.dto.update.*;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.InternalWarehouseMovementStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.WarehouseLocationMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseLocationServiceDefinition;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WarehouseLocationService implements WarehouseLocationServiceDefinition {

    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final WarehouseZoneRepository zoneRepository;
    private final BinLocationRepository binRepository;
    private final BinInventoryRepository binInventoryRepository;
    private final InternalWarehouseMovementRepository movementRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AuditFacadeDefinition auditFacade;

    @Override @Transactional
    public WarehouseZoneResponse createZone(WarehouseZoneCreate dto) {
        Warehouse warehouse = getWarehouse(dto.getWarehouseId());
        if (zoneRepository.existsByWarehouse_IdAndCodeIgnoreCase(warehouse.getId(), dto.getCode())) throw new ConflictException("Warehouse zone code already exists");
        WarehouseZone zone = new WarehouseZone(); zone.setWarehouse(warehouse); zone.setCode(dto.getCode()); zone.setName(dto.getName()); zone.setType(dto.getType()); zone.setCapacity(nonNegative(dto.getCapacity(), "Zone capacity cannot be negative")); zone.setDescription(dto.getDescription()); zone.setActive(true);
        WarehouseZone saved = zoneRepository.save(zone); auditFacade.recordCreate("WAREHOUSE_ZONE", saved.getId(), saved.getCode());
        return WarehouseLocationMapper.toZoneResponse(saved);
    }

    @Override @Transactional
    public WarehouseZoneResponse updateZone(Long id, WarehouseZoneUpdate dto) {
        WarehouseZone zone = getZone(id);
        if (zoneRepository.existsByWarehouse_IdAndCodeIgnoreCaseAndIdNot(zone.getWarehouse().getId(), dto.getCode(), id)) throw new ConflictException("Warehouse zone code already exists");
        zone.setCode(dto.getCode()); zone.setName(dto.getName()); zone.setType(dto.getType()); zone.setCapacity(nonNegative(dto.getCapacity(), "Zone capacity cannot be negative")); zone.setActive(dto.getActive()); zone.setDescription(dto.getDescription());
        WarehouseZone saved = zoneRepository.save(zone); auditFacade.recordFieldChange("WAREHOUSE_ZONE", saved.getId(), "updated", null, saved.getCode());
        return WarehouseLocationMapper.toZoneResponse(saved);
    }

    @Override public PageResponse<WarehouseZoneResponse> searchZones(Long warehouseId, Boolean active, String search, Pageable pageable) {
        Long companyId = companyScope();
        return PageResponse.from(zoneRepository.search(companyId, warehouseId, active, QueryParameterNormalizer.trimToNull(search), pageable).map(WarehouseLocationMapper::toZoneResponse));
    }

    @Override @Transactional
    public void deleteZone(Long id) { WarehouseZone zone = getZone(id); if (!zone.getBinLocations().isEmpty()) throw new BadRequestException("Warehouse zone cannot be deleted while it has bin locations"); zoneRepository.delete(zone); auditFacade.recordDelete("WAREHOUSE_ZONE", id, zone.getCode()); }

    @Override @Transactional
    public BinLocationResponse createBin(BinLocationCreate dto) {
        Warehouse warehouse = getWarehouse(dto.getWarehouseId()); WarehouseZone zone = getZone(dto.getZoneId()); ensureSameWarehouse(warehouse, zone.getWarehouse());
        if (binRepository.existsByWarehouse_IdAndCodeIgnoreCase(warehouse.getId(), dto.getCode())) throw new ConflictException("Bin location code already exists");
        BinLocation bin = new BinLocation(); bin.setWarehouse(warehouse); bin.setZone(zone); bin.setCode(dto.getCode()); bin.setName(dto.getName()); bin.setCapacity(nonNegative(dto.getCapacity(), "Bin capacity cannot be negative")); bin.setDescription(dto.getDescription()); bin.setActive(true);
        BinLocation saved = binRepository.save(bin); auditFacade.recordCreate("BIN_LOCATION", saved.getId(), saved.getCode()); return WarehouseLocationMapper.toBinResponse(saved);
    }

    @Override @Transactional
    public BinLocationResponse updateBin(Long id, BinLocationUpdate dto) {
        BinLocation bin = getBin(id); WarehouseZone zone = getZone(dto.getZoneId()); ensureSameWarehouse(bin.getWarehouse(), zone.getWarehouse());
        if (binRepository.existsByWarehouse_IdAndCodeIgnoreCaseAndIdNot(bin.getWarehouse().getId(), dto.getCode(), id)) throw new ConflictException("Bin location code already exists");
        bin.setZone(zone); bin.setCode(dto.getCode()); bin.setName(dto.getName()); bin.setCapacity(nonNegative(dto.getCapacity(), "Bin capacity cannot be negative")); bin.setActive(dto.getActive()); bin.setDescription(dto.getDescription());
        BinLocation saved = binRepository.save(bin); auditFacade.recordFieldChange("BIN_LOCATION", saved.getId(), "updated", null, saved.getCode()); return WarehouseLocationMapper.toBinResponse(saved);
    }

    @Override public PageResponse<BinLocationResponse> searchBins(Long warehouseId, Long zoneId, Boolean active, String search, Pageable pageable) {
        return PageResponse.from(binRepository.search(companyScope(), warehouseId, zoneId, active, QueryParameterNormalizer.trimToNull(search), pageable).map(WarehouseLocationMapper::toBinResponse));
    }

    @Override @Transactional
    public void deleteBin(Long id) { BinLocation bin = getBin(id); if (!bin.getInventory().isEmpty()) throw new BadRequestException("Bin location cannot be deleted while it has inventory"); binRepository.delete(bin); auditFacade.recordDelete("BIN_LOCATION", id, bin.getCode()); }

    @Override @Transactional
    public BinInventoryResponse setBinInventory(BinInventoryCreate dto) {
        BinLocation bin = getBin(dto.getBinLocationId()); Product product = getProduct(dto.getProductId()); ensureSameCompany(bin.getWarehouse(), product);
        BigDecimal quantity = nonNegative(dto.getQuantity(), "Bin inventory quantity cannot be negative");
        BinInventory inventory = binInventoryRepository.findByBinLocation_IdAndProduct_Id(bin.getId(), product.getId()).orElseGet(() -> new BinInventory(bin, product, BigDecimal.ZERO));
        inventory.setQuantity(quantity); BinInventory saved = binInventoryRepository.save(inventory); auditFacade.log("SET_BIN_INVENTORY", "BIN_INVENTORY", bin.getId(), "bin=" + bin.getCode() + ", product=" + product.getSku()); return WarehouseLocationMapper.toBinInventoryResponse(saved);
    }

    @Override public PageResponse<BinInventoryResponse> searchBinInventory(Long warehouseId, Long zoneId, Long binLocationId, Long productId, String search, Pageable pageable) {
        return PageResponse.from(binInventoryRepository.search(companyScope(), warehouseId, zoneId, binLocationId, productId, QueryParameterNormalizer.trimToNull(search), pageable).map(WarehouseLocationMapper::toBinInventoryResponse));
    }

    @Override @Transactional
    public InternalWarehouseMovementResponse moveInternal(InternalWarehouseMovementCreate dto) {
        if (dto.getSourceBinId().equals(dto.getDestinationBinId())) throw new BadRequestException("Source and destination bin must be different");
        BinLocation source = getBin(dto.getSourceBinId()); BinLocation destination = getBin(dto.getDestinationBinId()); ensureSameWarehouse(source.getWarehouse(), destination.getWarehouse());
        Product product = getProduct(dto.getProductId()); ensureSameCompany(source.getWarehouse(), product);
        BigDecimal quantity = positive(dto.getQuantity(), "Movement quantity must be greater than zero");
        BinInventory sourceInventory = binInventoryRepository.findForUpdate(source.getId(), product.getId()).orElseThrow(() -> new BadRequestException("Source bin has no inventory for selected product"));
        BinInventory destinationInventory = binInventoryRepository.findForUpdate(destination.getId(), product.getId()).orElseGet(() -> new BinInventory(destination, product, BigDecimal.ZERO));
        sourceInventory.decrease(quantity); destinationInventory.increase(quantity); binInventoryRepository.save(sourceInventory); binInventoryRepository.save(destinationInventory);
        InternalWarehouseMovement movement = new InternalWarehouseMovement(); movement.setWarehouse(source.getWarehouse()); movement.setProduct(product); movement.setSourceBin(source); movement.setDestinationBin(destination); movement.setQuantity(quantity); movement.setNote(dto.getNote()); movement.setStatus(InternalWarehouseMovementStatus.COMPLETED); movement.setCreatedBy(authenticatedUserProvider.getAuthenticatedUser());
        InternalWarehouseMovement saved = movementRepository.save(movement); auditFacade.recordCreate("INTERNAL_WAREHOUSE_MOVEMENT", saved.getId(), source.getCode() + " -> " + destination.getCode()); return WarehouseLocationMapper.toMovementResponse(saved);
    }

    @Override public PageResponse<InternalWarehouseMovementResponse> searchInternalMovements(Long warehouseId, Long productId, Long binLocationId, String search, Pageable pageable) {
        return PageResponse.from(movementRepository.search(companyScope(), warehouseId, productId, binLocationId, QueryParameterNormalizer.trimToNull(search), pageable).map(WarehouseLocationMapper::toMovementResponse));
    }

    private Warehouse getWarehouse(Long id) { return authenticatedUserProvider.isOverlord() ? warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found")) : warehouseRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found")); }
    private WarehouseZone getZone(Long id) { return authenticatedUserProvider.isOverlord() ? zoneRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse zone not found")) : zoneRepository.findByIdAndWarehouse_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Warehouse zone not found")); }
    private BinLocation getBin(Long id) { return authenticatedUserProvider.isOverlord() ? binRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bin location not found")) : binRepository.findByIdAndWarehouse_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Bin location not found")); }
    private Product getProduct(Long id) { return authenticatedUserProvider.isOverlord() ? productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found")) : productRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Product not found")); }
    private Long companyScope() { return authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(); }
    private void ensureSameWarehouse(Warehouse a, Warehouse b) { if (a == null || b == null || !a.getId().equals(b.getId())) throw new BadRequestException("Source and target must belong to the same warehouse"); }
    private void ensureSameCompany(Warehouse w, Product p) { if (w == null || p == null || p.getCompany() == null || !w.getCompany().getId().equals(p.getCompany().getId())) throw new BadRequestException("Product does not belong to warehouse company"); }
    private BigDecimal nonNegative(BigDecimal v, String msg) { if (v == null) return null; if (v.compareTo(BigDecimal.ZERO) < 0) throw new BadRequestException(msg); return v; }
    private BigDecimal positive(BigDecimal v, String msg) { if (v == null || v.compareTo(BigDecimal.ZERO) <= 0) throw new BadRequestException(msg); return v; }
}
