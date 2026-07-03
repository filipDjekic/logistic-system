package rs.logistics.logistics_system.service.implementation;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.BinInventoryCreate;
import rs.logistics.logistics_system.dto.create.BinLocationCreate;
import rs.logistics.logistics_system.dto.create.InternalWarehouseMovementCreate;
import rs.logistics.logistics_system.dto.create.WarehouseZoneCreate;
import rs.logistics.logistics_system.dto.response.BinInventoryResponse;
import rs.logistics.logistics_system.dto.response.BinLocationResponse;
import rs.logistics.logistics_system.dto.response.InternalWarehouseMovementResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.WarehouseZoneResponse;
import rs.logistics.logistics_system.dto.update.BinLocationUpdate;
import rs.logistics.logistics_system.dto.update.WarehouseZoneUpdate;
import rs.logistics.logistics_system.entity.BinInventory;
import rs.logistics.logistics_system.entity.BinLocation;
import rs.logistics.logistics_system.entity.InternalWarehouseMovement;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.entity.WarehouseZone;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.InternalWarehouseMovementStatus;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.WarehouseZoneType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.WarehouseLocationMapper;
import rs.logistics.logistics_system.repository.BinInventoryRepository;
import rs.logistics.logistics_system.repository.BinLocationRepository;
import rs.logistics.logistics_system.repository.InternalWarehouseMovementRepository;
import rs.logistics.logistics_system.repository.InventoryCountLineRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.repository.WarehouseZoneRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseLocationServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.service.support.BinIntegrityValidator;
import rs.logistics.logistics_system.service.support.PageableSortMapper;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;

@Service
@RequiredArgsConstructor
public class WarehouseLocationService implements WarehouseLocationServiceDefinition {

    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final WarehouseZoneRepository zoneRepository;
    private final BinLocationRepository binRepository;
    private final BinInventoryRepository binInventoryRepository;
    private final InternalWarehouseMovementRepository movementRepository;
    private final InventoryCountLineRepository inventoryCountLineRepository;
    private final StockMovementRepository stockMovementRepository;
    private final BinIntegrityValidator binIntegrityValidator;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AuditFacadeDefinition auditFacade;
    private final DomainEventServiceDefinition domainEventService;
    private final WarehouseAccessGuard warehouseAccessGuard;

    private static final Map<String, String> ZONE_SORT_ALIASES = Map.of(
            "warehouseName", "warehouse.name"
    );
    private static final Set<String> ZONE_SORT_PROPERTIES = Set.of(
            "code", "name", "type", "capacity", "active", "createdAt", "updatedAt", "warehouse.name"
    );

    private static final Map<String, String> BIN_SORT_ALIASES = Map.of(
            "zoneCode", "zone.code",
            "zoneName", "zone.name",
            "warehouseName", "warehouse.name"
    );
    private static final Set<String> BIN_SORT_PROPERTIES = Set.of(
            "code", "name", "capacity", "active", "createdAt", "updatedAt", "zone.code", "zone.name", "warehouse.name"
    );

    private static final Map<String, String> BIN_INVENTORY_SORT_ALIASES = Map.of(
            "binLocationCode", "binLocation.code",
            "binLocationName", "binLocation.name",
            "zoneCode", "binLocation.zone.code",
            "zoneName", "binLocation.zone.name",
            "productName", "product.name",
            "sku", "product.sku"
    );
    private static final Set<String> BIN_INVENTORY_SORT_PROPERTIES = Set.of(
            "quantity", "lastUpdated", "binLocation.code", "binLocation.name", "binLocation.zone.code", "binLocation.zone.name", "product.name", "product.sku"
    );

    private static final Map<String, String> INTERNAL_MOVEMENT_SORT_ALIASES = Map.of(
            "productName", "product.name",
            "sku", "product.sku",
            "sourceBinCode", "sourceBin.code",
            "destinationBinCode", "destinationBin.code",
            "warehouseName", "warehouse.name"
    );
    private static final Set<String> INTERNAL_MOVEMENT_SORT_PROPERTIES = Set.of(
            "createdAt", "quantity", "status", "product.name", "product.sku", "sourceBin.code", "destinationBin.code", "warehouse.name"
    );

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
        WarehouseZone zone = findZone(id);
        if (zoneRepository.existsByWarehouse_IdAndCodeIgnoreCaseAndIdNot(zone.getWarehouse().getId(), dto.getCode(), id)) throw new ConflictException("Warehouse zone code already exists");
        zone.setCode(dto.getCode()); zone.setName(dto.getName()); zone.setType(dto.getType()); zone.setCapacity(nonNegative(dto.getCapacity(), "Zone capacity cannot be negative")); zone.setActive(dto.getActive()); zone.setDescription(dto.getDescription());
        WarehouseZone saved = zoneRepository.save(zone); auditFacade.recordFieldChange("WAREHOUSE_ZONE", saved.getId(), "updated", null, saved.getCode());
        return WarehouseLocationMapper.toZoneResponse(saved);
    }

    @Override
    public WarehouseZoneResponse getZone(Long id) {
        return WarehouseLocationMapper.toZoneResponse(findZone(id));
    }

    @Override public PageResponse<WarehouseZoneResponse> searchZones(Long warehouseId, Boolean active, WarehouseZoneType type, String search, Pageable pageable) {
        Long companyId = companyScope();
        Pageable safePageable = PageableSortMapper.map(pageable, ZONE_SORT_ALIASES, ZONE_SORT_PROPERTIES, Sort.by(Sort.Direction.ASC, "code"));
        List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        Page<WarehouseZone> page = scopedWarehouseIds == null
                ? zoneRepository.search(companyId, warehouseId, active, type, QueryParameterNormalizer.trimToNull(search), safePageable)
                : scopedWarehouseIds.isEmpty()
                ? Page.empty(safePageable)
                : zoneRepository.searchAssigned(companyId, scopedWarehouseIds, warehouseId, active, type, QueryParameterNormalizer.trimToNull(search), safePageable);
        return PageResponse.from(page.map(WarehouseLocationMapper::toZoneResponse));
    }

    @Override
    @Transactional
    public void deleteZone(Long id) {
        WarehouseZone zone = findZone(id);
        warehouseAccessGuard.ensureCanMutateWarehouse(zone.getWarehouse());
        validateZoneForHardDelete(zone);
        zoneRepository.delete(zone);
        auditFacade.recordDelete("WAREHOUSE_ZONE", id, zone.getCode());
    }

    private void validateZoneForHardDelete(WarehouseZone zone) {
        if (!zone.getBinLocations().isEmpty()) {
            throw new BadRequestException("Warehouse zone cannot be hard-deleted while it has bin locations. Deactivate or archive the structure instead.");
        }
        if (inventoryCountLineRepository.existsByZoneId(zone.getId())) {
            throw new BadRequestException("Warehouse zone cannot be hard-deleted because it is referenced by inventory count history.");
        }
        if (stockMovementRepository.existsBySourceOrDestinationZoneId(zone.getId())) {
            throw new BadRequestException("Warehouse zone cannot be hard-deleted because it is referenced by stock movement history.");
        }
        if (movementRepository.existsBySourceOrDestinationZoneId(zone.getId())) {
            throw new BadRequestException("Warehouse zone cannot be hard-deleted because it is referenced by internal movement history.");
        }
    }

    @Override @Transactional
    public BinLocationResponse createBin(BinLocationCreate dto) {
        Warehouse warehouse = getWarehouse(dto.getWarehouseId());
        binIntegrityValidator.ensureBinTrackingEnabled(warehouse, "Bin locations cannot be created because bin tracking is disabled for this warehouse");
        WarehouseZone zone = findZone(dto.getZoneId()); ensureSameWarehouse(warehouse, zone.getWarehouse());
        if (binRepository.existsByWarehouse_IdAndCodeIgnoreCase(warehouse.getId(), dto.getCode())) throw new ConflictException("Bin location code already exists");
        BinLocation bin = new BinLocation(); bin.setWarehouse(warehouse); bin.setZone(zone); bin.setCode(dto.getCode()); bin.setName(dto.getName()); bin.setCapacity(nonNegative(dto.getCapacity(), "Bin capacity cannot be negative")); bin.setDescription(dto.getDescription()); bin.setActive(true);
        BinLocation saved = binRepository.save(bin); auditFacade.recordCreate("BIN_LOCATION", saved.getId(), saved.getCode()); return WarehouseLocationMapper.toBinResponse(saved);
    }

    @Override @Transactional
    public BinLocationResponse updateBin(Long id, BinLocationUpdate dto) {
        BinLocation bin = findBin(id);
        binIntegrityValidator.ensureBinTrackingEnabled(bin.getWarehouse(), "Bin locations cannot be updated because bin tracking is disabled for this warehouse");
        WarehouseZone zone = findZone(dto.getZoneId()); ensureSameWarehouse(bin.getWarehouse(), zone.getWarehouse());
        if (binRepository.existsByWarehouse_IdAndCodeIgnoreCaseAndIdNot(bin.getWarehouse().getId(), dto.getCode(), id)) throw new ConflictException("Bin location code already exists");
        bin.setZone(zone); bin.setCode(dto.getCode()); bin.setName(dto.getName()); bin.setCapacity(nonNegative(dto.getCapacity(), "Bin capacity cannot be negative")); bin.setActive(dto.getActive()); bin.setDescription(dto.getDescription());
        BinLocation saved = binRepository.save(bin); auditFacade.recordFieldChange("BIN_LOCATION", saved.getId(), "updated", null, saved.getCode()); return WarehouseLocationMapper.toBinResponse(saved);
    }

    @Override
    public BinLocationResponse getBin(Long id) {
        return WarehouseLocationMapper.toBinResponse(findBin(id));
    }

    @Override public PageResponse<BinLocationResponse> searchBins(Long warehouseId, Long zoneId, Boolean active, WarehouseZoneType type, String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.map(pageable, BIN_SORT_ALIASES, BIN_SORT_PROPERTIES, Sort.by(Sort.Direction.ASC, "code"));
        List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        Page<BinLocation> page = scopedWarehouseIds == null
                ? binRepository.search(companyScope(), warehouseId, zoneId, active, type, QueryParameterNormalizer.trimToNull(search), safePageable)
                : scopedWarehouseIds.isEmpty()
                ? Page.empty(safePageable)
                : binRepository.searchAssigned(companyScope(), scopedWarehouseIds, warehouseId, zoneId, active, type, QueryParameterNormalizer.trimToNull(search), safePageable);
        return PageResponse.from(page.map(WarehouseLocationMapper::toBinResponse));
    }

    @Override
    @Transactional
    public void deleteBin(Long id) {
        BinLocation bin = findBin(id);
        warehouseAccessGuard.ensureCanMutateWarehouse(bin.getWarehouse());
        validateBinForHardDelete(bin);
        binRepository.delete(bin);
        auditFacade.recordDelete("BIN_LOCATION", id, bin.getCode());
    }

    private void validateBinForHardDelete(BinLocation bin) {
        if (!bin.getInventory().isEmpty()) {
            throw new BadRequestException("Bin location cannot be hard-deleted while it has inventory. Clear stock through stock movement/count workflow instead.");
        }
        if (inventoryCountLineRepository.existsByBinLocation_Id(bin.getId())) {
            throw new BadRequestException("Bin location cannot be hard-deleted because it is referenced by inventory count history.");
        }
        if (stockMovementRepository.existsBySourceBin_IdOrDestinationBin_Id(bin.getId(), bin.getId())) {
            throw new BadRequestException("Bin location cannot be hard-deleted because it is referenced by stock movement history.");
        }
        if (movementRepository.existsBySourceBin_IdOrDestinationBin_Id(bin.getId(), bin.getId())) {
            throw new BadRequestException("Bin location cannot be hard-deleted because it is referenced by internal movement history.");
        }
    }

    @Override @Transactional
    public BinInventoryResponse setBinInventory(BinInventoryCreate dto) {
        BinLocation bin = findBin(dto.getBinLocationId());
        Product product = getProduct(dto.getProductId());
        ensureSameCompany(bin.getWarehouse(), product);
        binIntegrityValidator.ensureBinTrackingEnabled(bin.getWarehouse(), "Bin inventory cannot be maintained because bin tracking is disabled for this warehouse");
        binIntegrityValidator.ensureActiveBin(bin, "Bin location is not active");

        BigDecimal quantity = binIntegrityValidator.requireNonNegative(dto.getQuantity(), "Bin inventory quantity cannot be negative");
        WarehouseInventory warehouseInventory = binIntegrityValidator.lockWarehouseInventory(bin.getWarehouse(), product);
        BinInventory inventory = binIntegrityValidator.lockOrCreateBinInventory(bin, product);
        BigDecimal quantityBefore = inventory.getSafeQuantity();
        binIntegrityValidator.ensureBinInventoryDoesNotExceedWarehouseInventory(bin, product, quantity, warehouseInventory);

        inventory.setQuantity(quantity);
        BinInventory saved = binInventoryRepository.saveAndFlush(inventory);
        auditFacade.recordFieldChange("BIN_INVENTORY", bin.getId(), binInventoryIdentifier(saved), "quantity", quantityBefore, saved.getSafeQuantity());
        auditFacade.log("SET_BIN_INVENTORY", "BIN_INVENTORY", bin.getId(), "bin=" + bin.getCode() + ", product=" + product.getSku());
        recordBinInventoryDomainEvent(saved, quantityBefore, saved.getSafeQuantity());
        return WarehouseLocationMapper.toBinInventoryResponse(saved);
    }

    @Override public PageResponse<BinInventoryResponse> searchBinInventory(Long warehouseId, Long zoneId, Long binLocationId, Long productId, BigDecimal quantityMin, BigDecimal quantityMax, Boolean reserved, Boolean available, String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.map(pageable, BIN_INVENTORY_SORT_ALIASES, BIN_INVENTORY_SORT_PROPERTIES, Sort.by(Sort.Direction.DESC, "lastUpdated"));
        List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        Page<BinInventory> page = scopedWarehouseIds == null
                ? binInventoryRepository.search(companyScope(), warehouseId, zoneId, binLocationId, productId, quantityMin, quantityMax, reserved, available, QueryParameterNormalizer.trimToNull(search), safePageable)
                : scopedWarehouseIds.isEmpty()
                ? Page.empty(safePageable)
                : binInventoryRepository.searchAssigned(companyScope(), scopedWarehouseIds, warehouseId, zoneId, binLocationId, productId, quantityMin, quantityMax, reserved, available, QueryParameterNormalizer.trimToNull(search), safePageable);
        return PageResponse.from(page.map(WarehouseLocationMapper::toBinInventoryResponse));
    }

    @Override @Transactional
    public InternalWarehouseMovementResponse moveInternal(InternalWarehouseMovementCreate dto) {
        BinLocation source = findBin(dto.getSourceBinId());
        BinLocation destination = findBin(dto.getDestinationBinId());
        binIntegrityValidator.ensureBinTrackingEnabled(source.getWarehouse(), "Internal warehouse movement requires bin tracking to be enabled for this warehouse");
        binIntegrityValidator.ensureDifferentBins(source, destination);
        binIntegrityValidator.ensureSameWarehouse(source, destination);
        binIntegrityValidator.ensureActiveBin(source, "Source bin location is not active");
        binIntegrityValidator.ensureActiveBin(destination, "Destination bin location is not active");

        Product product = getProduct(dto.getProductId());
        ensureSameCompany(source.getWarehouse(), product);
        BigDecimal quantity = binIntegrityValidator.requirePositive(dto.getQuantity(), "Movement quantity must be greater than zero");

        WarehouseInventory warehouseInventory = binIntegrityValidator.lockWarehouseInventory(source.getWarehouse(), product);

        BinInventory sourceInventory;
        BinInventory destinationInventory;
        if (source.getId().compareTo(destination.getId()) < 0) {
            sourceInventory = binIntegrityValidator.lockRequiredBinInventory(source, product, "Source bin has no inventory for selected product");
            destinationInventory = binIntegrityValidator.lockOrCreateBinInventory(destination, product);
        } else {
            destinationInventory = binIntegrityValidator.lockOrCreateBinInventory(destination, product);
            sourceInventory = binIntegrityValidator.lockRequiredBinInventory(source, product, "Source bin has no inventory for selected product");
        }

        BigDecimal sourceBefore = sourceInventory.getSafeQuantity();
        BigDecimal destinationBefore = destinationInventory.getSafeQuantity();

        binIntegrityValidator.ensureInternalMovementCanBeApplied(sourceInventory, quantity);
        try {
            sourceInventory.decrease(quantity);
            destinationInventory.increase(quantity);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new BadRequestException(ex.getMessage());
        }

        BigDecimal sourceAfter = sourceInventory.getSafeQuantity();
        BigDecimal destinationAfter = destinationInventory.getSafeQuantity();

        binIntegrityValidator.ensureInternalMovementDoesNotExceedWarehouseInventory(
                source,
                destination,
                product,
                sourceAfter,
                destinationAfter,
                warehouseInventory
        );

        binInventoryRepository.saveAndFlush(sourceInventory);
        binInventoryRepository.saveAndFlush(destinationInventory);

        InternalWarehouseMovement movement = new InternalWarehouseMovement();
        movement.setWarehouse(source.getWarehouse());
        movement.setProduct(product);
        movement.setSourceBin(source);
        movement.setDestinationBin(destination);
        movement.setQuantity(quantity);
        movement.setNote(dto.getNote());
        movement.setStatus(InternalWarehouseMovementStatus.COMPLETED);
        movement.setCreatedBy(authenticatedUserProvider.getAuthenticatedUser());
        InternalWarehouseMovement saved = movementRepository.save(movement);

        recordInternalMovementAudit(saved, sourceInventory, destinationInventory, sourceBefore, sourceAfter, destinationBefore, destinationAfter);
        recordInternalMovementDomainEvent(saved, sourceBefore, sourceAfter, destinationBefore, destinationAfter);

        return WarehouseLocationMapper.toMovementResponse(saved);
    }

    private void recordBinInventoryDomainEvent(BinInventory inventory, BigDecimal quantityBefore, BigDecimal quantityAfter) {
        domainEventService.record(
                DomainEventType.INVENTORY_LIFECYCLE,
                OperationalEntityType.WAREHOUSE_INVENTORY,
                inventory.getBinLocation().getWarehouse().getId(),
                binInventoryIdentifier(inventory),
                "Bin inventory quantity changed",
                "{\"warehouseId\":" + inventory.getBinLocation().getWarehouse().getId()
                        + ",\"binLocationId\":" + inventory.getBinLocation().getId()
                        + ",\"productId\":" + inventory.getProduct().getId()
                        + ",\"quantityBefore\":\"" + quantityBefore + "\""
                        + ",\"quantityAfter\":\"" + quantityAfter + "\""
                        + "}",
                inventory.getBinLocation().getWarehouse().getCompany() != null
                        ? inventory.getBinLocation().getWarehouse().getCompany().getId()
                        : null
        );
    }

    private void recordInternalMovementAudit(
            InternalWarehouseMovement movement,
            BinInventory sourceInventory,
            BinInventory destinationInventory,
            BigDecimal sourceBefore,
            BigDecimal sourceAfter,
            BigDecimal destinationBefore,
            BigDecimal destinationAfter
    ) {
        String identifier = internalMovementIdentifier(movement);

        auditFacade.recordCreate("INTERNAL_WAREHOUSE_MOVEMENT", movement.getId(), identifier);
        auditFacade.recordFieldChange("INTERNAL_WAREHOUSE_MOVEMENT", movement.getId(), identifier, "warehouseId", null, movement.getWarehouse().getId());
        auditFacade.recordFieldChange("INTERNAL_WAREHOUSE_MOVEMENT", movement.getId(), identifier, "productId", null, movement.getProduct().getId());
        auditFacade.recordFieldChange("INTERNAL_WAREHOUSE_MOVEMENT", movement.getId(), identifier, "sourceBinId", null, movement.getSourceBin().getId());
        auditFacade.recordFieldChange("INTERNAL_WAREHOUSE_MOVEMENT", movement.getId(), identifier, "destinationBinId", null, movement.getDestinationBin().getId());
        auditFacade.recordFieldChange("INTERNAL_WAREHOUSE_MOVEMENT", movement.getId(), identifier, "quantity", null, movement.getQuantity());
        auditFacade.recordStatusChange("INTERNAL_WAREHOUSE_MOVEMENT", movement.getId(), identifier, "status", null, movement.getStatus());

        auditFacade.recordFieldChange("BIN_INVENTORY", movement.getSourceBin().getId(), binInventoryIdentifier(sourceInventory), "quantity", sourceBefore, sourceAfter);
        auditFacade.recordFieldChange("BIN_INVENTORY", movement.getDestinationBin().getId(), binInventoryIdentifier(destinationInventory), "quantity", destinationBefore, destinationAfter);
        auditFacade.log(
                "INTERNAL_BIN_MOVEMENT",
                "INTERNAL_WAREHOUSE_MOVEMENT",
                movement.getId(),
                identifier,
                "Moved " + movement.getQuantity()
                        + " of product " + movement.getProduct().getSku()
                        + " from bin " + movement.getSourceBin().getCode()
                        + " to bin " + movement.getDestinationBin().getCode()
                        + " without changing warehouse inventory"
        );
    }

    private void recordInternalMovementDomainEvent(
            InternalWarehouseMovement movement,
            BigDecimal sourceBefore,
            BigDecimal sourceAfter,
            BigDecimal destinationBefore,
            BigDecimal destinationAfter
    ) {
        domainEventService.record(
                DomainEventType.INVENTORY_LIFECYCLE,
                OperationalEntityType.INTERNAL_WAREHOUSE_MOVEMENT,
                movement.getId(),
                internalMovementIdentifier(movement),
                "Internal warehouse movement completed",
                "{\"warehouseId\":" + movement.getWarehouse().getId()
                        + ",\"productId\":" + movement.getProduct().getId()
                        + ",\"sourceBinId\":" + movement.getSourceBin().getId()
                        + ",\"destinationBinId\":" + movement.getDestinationBin().getId()
                        + ",\"quantity\":\"" + movement.getQuantity() + "\""
                        + ",\"sourceBefore\":\"" + sourceBefore + "\""
                        + ",\"sourceAfter\":\"" + sourceAfter + "\""
                        + ",\"destinationBefore\":\"" + destinationBefore + "\""
                        + ",\"destinationAfter\":\"" + destinationAfter + "\"}",
                movement.getWarehouse().getCompany() != null ? movement.getWarehouse().getCompany().getId() : null
        );
    }

    private String internalMovementIdentifier(InternalWarehouseMovement movement) {
        return movement.getSourceBin().getCode() + " -> " + movement.getDestinationBin().getCode()
                + ", product=" + movement.getProduct().getSku()
                + ", quantity=" + movement.getQuantity();
    }

    private String binInventoryIdentifier(BinInventory inventory) {
        return "binId=" + inventory.getBinLocation().getId()
                + ",bin=" + inventory.getBinLocation().getCode()
                + ",productId=" + inventory.getProduct().getId();
    }

    @Override public PageResponse<InternalWarehouseMovementResponse> searchInternalMovements(Long warehouseId, Long productId, Long zoneId, Long binLocationId, String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.map(pageable, INTERNAL_MOVEMENT_SORT_ALIASES, INTERNAL_MOVEMENT_SORT_PROPERTIES, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        Page<InternalWarehouseMovement> page = scopedWarehouseIds == null
                ? movementRepository.search(companyScope(), warehouseId, productId, zoneId, binLocationId, QueryParameterNormalizer.trimToNull(search), safePageable)
                : scopedWarehouseIds.isEmpty()
                ? Page.empty(safePageable)
                : movementRepository.searchAssigned(companyScope(), scopedWarehouseIds, warehouseId, productId, zoneId, binLocationId, QueryParameterNormalizer.trimToNull(search), safePageable);
        return PageResponse.from(page.map(WarehouseLocationMapper::toMovementResponse));
    }

    private Warehouse getWarehouse(Long id) {
        Warehouse warehouse = authenticatedUserProvider.isOverlord()
                ? warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"))
                : warehouseRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        warehouseAccessGuard.ensureCanMutateWarehouse(warehouse);
        return warehouse;
    }

    private WarehouseZone findZone(Long id) {
        WarehouseZone zone = authenticatedUserProvider.isOverlord()
                ? zoneRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse zone not found"))
                : zoneRepository.findByIdAndWarehouse_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Warehouse zone not found"));
        warehouseAccessGuard.ensureCanReadWarehouse(zone.getWarehouse());
        return zone;
    }

    private BinLocation findBin(Long id) {
        BinLocation bin = authenticatedUserProvider.isOverlord()
                ? binRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bin location not found"))
                : binRepository.findByIdAndWarehouse_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Bin location not found"));
        warehouseAccessGuard.ensureCanReadWarehouse(bin.getWarehouse());
        return bin;
    }
    private Product getProduct(Long id) { return authenticatedUserProvider.isOverlord() ? productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found")) : productRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Product not found")); }
    private Long companyScope() { return authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(); }
    private void ensureSameWarehouse(Warehouse a, Warehouse b) { if (a == null || b == null || !a.getId().equals(b.getId())) throw new BadRequestException("Source and target must belong to the same warehouse"); }
    private void ensureSameCompany(Warehouse w, Product p) { if (w == null || p == null || p.getCompany() == null || !w.getCompany().getId().equals(p.getCompany().getId())) throw new BadRequestException("Product does not belong to warehouse company"); }
    private BigDecimal nonNegative(BigDecimal v, String msg) { if (v == null) return null; if (v.compareTo(BigDecimal.ZERO) < 0) throw new BadRequestException(msg); return v; }
    private BigDecimal positive(BigDecimal v, String msg) { if (v == null || v.compareTo(BigDecimal.ZERO) <= 0) throw new BadRequestException(msg); return v; }
}
