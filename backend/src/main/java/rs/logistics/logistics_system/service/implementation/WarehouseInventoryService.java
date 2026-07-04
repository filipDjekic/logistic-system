package rs.logistics.logistics_system.service.implementation;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.create.StockReservationCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.response.StatusCountResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.BinInventoryRepository;
import rs.logistics.logistics_system.repository.InventoryCountSessionRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;
import rs.logistics.logistics_system.service.support.OptimisticLockGuard;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;

@Service
@RequiredArgsConstructor
public class WarehouseInventoryService implements WarehouseInventoryServiceDefinition {

    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final BinInventoryRepository binInventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final InventoryCountSessionRepository inventoryCountSessionRepository;
    private final AuditFacadeDefinition auditFacade;
    private final NotificationServiceDefinition notificationService;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AppProperties appProperties;
    private final WarehouseAccessGuard warehouseAccessGuard;

    @Override
    @Transactional
    public WarehouseInventoryResponse create(WarehouseInventoryCreate dto) {
        Warehouse warehouse = getAccessibleWarehouseForUpdate(dto.getWarehouseId());
        Product product = getAccessibleProduct(dto.getProductId());

        validateSameCompany(warehouse, product);

        if (warehouseInventoryRepository.existsByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())) {
            throw new BadRequestException("Warehouse inventory already exists for selected warehouse and product");
        }

        WarehouseInventory warehouseInventory = createInventory(dto, warehouse, product);
        validateWarehouseCapacity(warehouse, BigDecimal.ZERO, warehouseInventory.getSafeQuantity());

        WarehouseInventory saved = warehouseInventoryRepository.saveAndFlush(warehouseInventory);

        if (QueryParameterNormalizer.zeroIfNull(saved.getQuantity()).compareTo(BigDecimal.ZERO) > 0) {
            recordInventoryMovement(
                    saved,
                    StockMovementType.INBOUND,
                    StockMovementReasonCode.INITIAL_STOCK,
                    "Initial inventory record created",
                    BigDecimal.ZERO,
                    saved.getQuantity(),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            );
        }

        auditFacade.recordCreate("WAREHOUSE_INVENTORY", saved.getWarehouse().getId(), inventoryIdentifier(saved));
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", saved.getWarehouse().getId(), inventoryIdentifier(saved), "quantity", null, saved.getQuantity());
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", saved.getWarehouse().getId(), inventoryIdentifier(saved), "reservedQuantity", null, saved.getReservedQuantity());
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", saved.getWarehouse().getId(), inventoryIdentifier(saved), "minStockLevel", null, saved.getMinStockLevel());
        auditFacade.log(
                "CREATE",
                "WAREHOUSE_INVENTORY",
                saved.getWarehouse().getId(),
                "Warehouse inventory created for warehouseId=" + warehouse.getId() + ", productId=" + product.getId()
        );

        return WarehouseInventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public WarehouseInventoryResponse update(Long warehouseId, Long productId, WarehouseInventoryUpdate dto) {
        Warehouse warehouse = getAccessibleWarehouseForUpdate(warehouseId);
        Product product = getAccessibleProduct(productId);

        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));
        OptimisticLockGuard.requireExpectedVersion(dto.getExpectedVersion(), inventory.getVersion(), "Warehouse inventory");

        BigDecimal oldQuantity = QueryParameterNormalizer.zeroIfNull(inventory.getQuantity());
        BigDecimal oldReserved = QueryParameterNormalizer.zeroIfNull(inventory.getReservedQuantity());
        BigDecimal oldMinStock = inventory.getMinStockLevel();

        if (dto.getQuantity() != null && dto.getQuantity().compareTo(oldQuantity) != 0) {
            throw new BadRequestException("Inventory quantity can only be changed through stock movement operations");
        }

        dto.setWarehouseId(warehouseId);
        dto.setProductId(productId);

        applyInventoryChange(() -> inventory.updateMinStockLevel(dto.getMinStockLevel()));
        WarehouseInventory saved = warehouseInventoryRepository.saveAndFlush(inventory);

        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", warehouse.getId(), inventoryIdentifier(saved), "quantity", oldQuantity, saved.getQuantity());
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", warehouse.getId(), inventoryIdentifier(saved), "reservedQuantity", oldReserved, saved.getReservedQuantity());
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", warehouse.getId(), inventoryIdentifier(saved), "availableQuantity", oldQuantity.subtract(oldReserved), QueryParameterNormalizer.zeroIfNull(saved.getQuantity()).subtract(QueryParameterNormalizer.zeroIfNull(saved.getReservedQuantity())));
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", warehouse.getId(), inventoryIdentifier(saved), "minStockLevel", oldMinStock, saved.getMinStockLevel());
        auditFacade.log(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                warehouse.getId(),
                "Warehouse inventory updated for warehouseId=" + warehouse.getId() + ", productId=" + product.getId()
        );

        return WarehouseInventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseInventoryResponse findByWarehouseAndProduct(Long warehouseId, Long productId) {
        Warehouse warehouse = getAccessibleWarehouse(warehouseId);
        Product product = getAccessibleProduct(productId);

        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouse_IdAndProduct_Id(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        return WarehouseInventoryMapper.toResponse(inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WarehouseInventoryResponse> search(String search, Long warehouseId, Long productId, String status, Pageable pageable) {
        String normalizedSearch = QueryParameterNormalizer.trimToNull(search);
        String normalizedStatus = normalizeStatus(status);
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        if (warehouseId != null) {
            getAccessibleWarehouse(warehouseId);
        }

        if (productId != null) {
            getAccessibleProduct(productId);
        }

        List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        Page<WarehouseInventory> page;
        if (scopedWarehouseIds != null) {
            page = scopedWarehouseIds.isEmpty()
                    ? Page.empty(pageable)
                    : warehouseInventoryRepository.searchInventoryForWarehouseIds(
                    companyId,
                    scopedWarehouseIds,
                    normalizedSearch,
                    warehouseId,
                    productId,
                    normalizedStatus,
                    pageable
            );
        } else {
            page = warehouseInventoryRepository.searchInventory(companyId, normalizedSearch, warehouseId, productId, normalizedStatus, pageable);
        }

        return PageResponse.from(page.map(WarehouseInventoryMapper::toResponse));
    }


    @Override
    @Transactional(readOnly = true)
    public List<StatusCountResponse> countByStatus(String search, Long warehouseId, Long productId) {
        String normalizedSearch = QueryParameterNormalizer.trimToNull(search);
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        if (warehouseId != null) {
            getAccessibleWarehouse(warehouseId);
        }

        if (productId != null) {
            getAccessibleProduct(productId);
        }

        List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();

        return List.of("LOW_STOCK", "RESERVED", "OUT_OF_STOCK", "AVAILABLE", "SUFFICIENT")
                .stream()
                .map(status -> new StatusCountResponse(
                        status,
                        scopedWarehouseIds == null
                                ? warehouseInventoryRepository.countByDerivedStatus(companyId, normalizedSearch, warehouseId, productId, status)
                                : scopedWarehouseIds.isEmpty()
                                ? 0
                                : warehouseInventoryRepository.countByDerivedStatusForWarehouseIds(companyId, scopedWarehouseIds, normalizedSearch, warehouseId, productId, status)
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseInventoryResponse> findByWarehouse(Long warehouseId) {
        getAccessibleWarehouse(warehouseId);

        List<WarehouseInventory> inventoryList = authenticatedUserProvider.isOverlord()
                ? warehouseInventoryRepository.findByWarehouse_Id(warehouseId)
                : warehouseInventoryRepository.findByWarehouse_IdAndWarehouse_Company_Id(
                        warehouseId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return inventoryList.stream()
                .map(WarehouseInventoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseInventoryResponse> findByProduct(Long productId) {
        getAccessibleProduct(productId);

        List<WarehouseInventory> inventoryList = authenticatedUserProvider.isOverlord()
                ? warehouseInventoryRepository.findByProduct_Id(productId)
                : warehouseInventoryRepository.findByProduct_IdAndProduct_Company_Id(
                        productId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return inventoryList.stream()
                .map(WarehouseInventoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long warehouseId, Long productId) {
        Warehouse warehouse = getAccessibleWarehouseForUpdate(warehouseId);
        Product product = getAccessibleProduct(productId);

        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouse_IdAndProduct_Id(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        validateForHardDelete(inventory);

        warehouseInventoryRepository.delete(inventory);

        auditFacade.recordDelete("WAREHOUSE_INVENTORY", warehouseId, inventoryIdentifier(inventory));
        auditFacade.log(
                "DELETE",
                "WAREHOUSE_INVENTORY",
                warehouseId,
                "Warehouse inventory deleted for warehouseId=" + warehouseId + ", productId=" + productId
        );
    }

    @Override
    @Transactional
    public WarehouseInventoryResponse reserveStock(StockReservationCreate dto) {
        WarehouseInventory saved = reserveStockInternal(dto.getWarehouseId(), dto.getProductId(), dto.getQuantity(),
                dto.getNote() == null || dto.getNote().isBlank() ? "Manual stock reservation" : dto.getNote().trim());
        return WarehouseInventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public WarehouseInventoryResponse releaseReservedStock(StockReservationCreate dto) {
        WarehouseInventory saved = releaseReservedStockInternal(dto.getWarehouseId(), dto.getProductId(), dto.getQuantity(),
                dto.getNote() == null || dto.getNote().isBlank() ? "Manual stock reservation released" : dto.getNote().trim());
        return WarehouseInventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void reserveStock(Long warehouseId, Long productId, BigDecimal quantity) {
        reserveStockInternal(warehouseId, productId, quantity, "Reserved quantity increased");
    }

    @Override
    @Transactional
    public void releaseReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        releaseReservedStockInternal(warehouseId, productId, quantity, "Reserved quantity released");
    }

    private WarehouseInventory reserveStockInternal(Long warehouseId, Long productId, BigDecimal quantity, String note) {
        WarehouseInventory inventory = getInventoryForUpdate(warehouseId, productId);

        BigDecimal requested = positiveQuantity(quantity, "Reserve quantity must be greater than zero");
        BigDecimal quantityBefore = inventory.getSafeQuantity();
        BigDecimal reservedBefore = inventory.getSafeReservedQuantity();

        applyInventoryChange(() -> inventory.reserve(requested));
        WarehouseInventory saved = warehouseInventoryRepository.saveAndFlush(inventory);

        recordInventoryMovement(
                saved,
                StockMovementType.RESERVATION,
                StockMovementReasonCode.STOCK_RESERVED,
                note,
                quantityBefore,
                quantityBefore,
                reservedBefore,
                saved.getReservedQuantity()
        );

        checkLowStockAndNotify(saved);
        return saved;
    }

    private WarehouseInventory releaseReservedStockInternal(Long warehouseId, Long productId, BigDecimal quantity, String note) {
        WarehouseInventory inventory = getInventoryForUpdate(warehouseId, productId);

        BigDecimal requested = positiveQuantity(quantity, "Release quantity must be greater than zero");
        BigDecimal quantityBefore = inventory.getSafeQuantity();
        BigDecimal reservedBefore = inventory.getSafeReservedQuantity();

        applyInventoryChange(() -> inventory.release(requested));
        WarehouseInventory saved = warehouseInventoryRepository.saveAndFlush(inventory);

        recordInventoryMovement(
                saved,
                StockMovementType.RESERVATION_RELEASE,
                StockMovementReasonCode.RESERVATION_RELEASED,
                note,
                quantityBefore,
                quantityBefore,
                reservedBefore,
                saved.getReservedQuantity()
        );

        checkLowStockAndNotify(saved);
        return saved;
    }

    @Override
    @Transactional
    public void moveOutReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        WarehouseInventory inventory = getInventoryForUpdate(warehouseId, productId);

        BigDecimal requested = positiveQuantity(quantity, "Move-out quantity must be greater than zero");
        BigDecimal quantityBefore = inventory.getSafeQuantity();
        BigDecimal reservedBefore = inventory.getSafeReservedQuantity();

        applyInventoryChange(() -> inventory.moveOutReserved(requested));
        WarehouseInventory saved = warehouseInventoryRepository.saveAndFlush(inventory);

        recordInventoryMovement(
                saved,
                StockMovementType.OUTBOUND,
                StockMovementReasonCode.MANUAL_OUTBOUND,
                "Reserved stock moved out",
                quantityBefore,
                saved.getQuantity(),
                reservedBefore,
                saved.getReservedQuantity()
        );

        checkLowStockAndNotify(saved);
    }

    @Override
    @Transactional
    public void moveInStock(Long warehouseId, Long productId, BigDecimal quantity) {
        WarehouseInventory inventory = getInventoryForUpdate(warehouseId, productId);

        BigDecimal requested = positiveQuantity(quantity, "Move-in quantity must be greater than zero");
        BigDecimal quantityBefore = inventory.getSafeQuantity();
        BigDecimal reservedBefore = inventory.getSafeReservedQuantity();
        BigDecimal quantityAfter = quantityBefore.add(requested);

        validateWarehouseCapacity(inventory.getWarehouse(), quantityBefore, quantityAfter);

        applyInventoryChange(() -> inventory.increase(requested));
        WarehouseInventory saved = warehouseInventoryRepository.saveAndFlush(inventory);

        recordInventoryMovement(
                saved,
                StockMovementType.INBOUND,
                StockMovementReasonCode.MANUAL_INBOUND,
                "Stock moved in",
                quantityBefore,
                saved.getQuantity(),
                reservedBefore,
                saved.getReservedQuantity()
        );
    }

    @Override
    public void checkLowStockAndNotify(WarehouseInventory inventory) {
        if (inventory == null) {
            return;
        }

        BigDecimal availableQuantity = inventory.getAvailableQuantity();
        BigDecimal minStockLevel = QueryParameterNormalizer.zeroIfNull(inventory.getMinStockLevel());

        if (minStockLevel.compareTo(BigDecimal.ZERO) > 0 && availableQuantity.compareTo(minStockLevel) <= 0) {
            auditFacade.log(
                    "LOW_STOCK",
                    "WAREHOUSE_INVENTORY",
                    inventory.getWarehouse().getId(),
                    "Low stock detected for warehouseId=" + inventory.getWarehouse().getId()
                            + ", productId=" + inventory.getProduct().getId()
            );

            if (inventory.getWarehouse().getManager() != null
                    && inventory.getWarehouse().getManager().getUser() != null) {
                notificationService.createSystemNotification(
                        inventory.getWarehouse().getManager().getUser().getId(),
                        "Low stock",
                        "Product '" + inventory.getProduct().getName() + "' is at or below minimum stock level in warehouse '"
                                + inventory.getWarehouse().getName() + "'.",
                        NotificationType.WARNING
                );
            }
        }
    }

    private void validateForHardDelete(WarehouseInventory inventory) {
        Long warehouseId = inventory.getWarehouse().getId();
        Long productId = inventory.getProduct().getId();

        if (inventory.hasStockOrReservation()) {
            throw new ConflictException("Warehouse inventory cannot be hard-deleted while it has stock or reserved quantity. Use stock movement/count workflow instead.");
        }

        if (binInventoryRepository.existsByWarehouseIdAndProductId(warehouseId, productId)) {
            throw new ConflictException("Warehouse inventory cannot be hard-deleted because it has bin inventory references. Use stock movement/count workflow instead.");
        }

        if (stockMovementRepository.existsByWarehouse_IdAndProduct_Id(warehouseId, productId)) {
            throw new ConflictException("Warehouse inventory cannot be hard-deleted because it has stock movement history. Use stock movement/count workflow instead.");
        }

        if (inventoryCountSessionRepository.existsByWarehouseIdAndProductId(warehouseId, productId)) {
            throw new ConflictException("Warehouse inventory cannot be hard-deleted because it is referenced by inventory count history. Use stock movement/count workflow instead.");
        }
    }

    private WarehouseInventory createInventory(WarehouseInventoryCreate dto, Warehouse warehouse, Product product) {
        try {
            return WarehouseInventoryMapper.toEntity(dto, warehouse, product);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new BadRequestException(ex.getMessage());
        }
    }

    private void applyInventoryChange(Runnable inventoryMutation) {
        try {
            inventoryMutation.run();
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new BadRequestException(ex.getMessage());
        }
    }

    private WarehouseInventory getInventoryForUpdate(Long warehouseId, Long productId) {
        Warehouse warehouse = getAccessibleWarehouseForUpdate(warehouseId);
        Product product = getAccessibleProduct(productId);
        validateSameCompany(warehouse, product);

        return warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));
    }

    private Warehouse getAccessibleWarehouse(Long warehouseId) {
        Warehouse warehouse = authenticatedUserProvider.isOverlord()
                ? warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"))
                : warehouseRepository.findByIdAndCompany_Id(
                        warehouseId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        enforceWarehouseScopeForCurrentRole(warehouse, false);
        return warehouse;
    }

    private Warehouse getAccessibleWarehouseForUpdate(Long warehouseId) {
        Warehouse warehouse = authenticatedUserProvider.isOverlord()
                ? warehouseRepository.findByIdForUpdate(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"))
                : warehouseRepository.findByIdAndCompanyIdForUpdate(
                        warehouseId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        enforceWarehouseScopeForCurrentRole(warehouse, true);
        return warehouse;
    }

    private void enforceWarehouseScopeForCurrentRole(Warehouse warehouse, boolean write) {
        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER") || authenticatedUserProvider.hasRole("WORKER")) {
            if (write) {
                warehouseAccessGuard.ensureCanMutateWarehouse(warehouse);
            } else {
                warehouseAccessGuard.ensureCanReadWarehouse(warehouse);
            }
        }
    }

    private Product getAccessibleProduct(Long productId) {
        if (authenticatedUserProvider.isOverlord()) {
            return productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        }

        return productRepository.findByIdAndCompany_Id(
                        productId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private void validateSameCompany(Warehouse warehouse, Product product) {
        Long warehouseCompanyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;
        Long productCompanyId = product.getCompany() != null ? product.getCompany().getId() : null;

        authenticatedUserProvider.ensureSameCompany(
                warehouseCompanyId,
                productCompanyId,
                "Warehouse and product must belong to the same company"
        );
    }

    private void recordInventoryMovement(
            WarehouseInventory inventory,
            StockMovementType movementType,
            StockMovementReasonCode reasonCode,
            String note,
            BigDecimal quantityBefore,
            BigDecimal quantityAfter,
            BigDecimal reservedBefore,
            BigDecimal reservedAfter
    ) {
        User currentUser = authenticatedUserProvider.getAuthenticatedUser();
        if (currentUser == null) {
            return;
        }

        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", inventory.getWarehouse().getId(), inventoryIdentifier(inventory), "quantity", quantityBefore, quantityAfter);
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", inventory.getWarehouse().getId(), inventoryIdentifier(inventory), "reservedQuantity", reservedBefore, reservedAfter);
        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                inventoryIdentifier(inventory),
                "availableQuantity",
                quantityBefore.subtract(reservedBefore),
                quantityAfter.subtract(reservedAfter)
        );

        StockMovement movement = new StockMovement();
        movement.setMovementType(movementType);
        BigDecimal resolvedMovementQuantity = resolveMovementQuantity(quantityBefore, quantityAfter, reservedBefore, reservedAfter);
        movement.setQuantity(resolvedMovementQuantity);
        movement.setExpectedQuantity(resolvedMovementQuantity);
        movement.setActualQuantity(resolvedMovementQuantity);
        movement.setDiscrepancyQuantity(BigDecimal.ZERO);
        movement.setReasonCode(reasonCode);
        movement.setReasonDescription(note);
        movement.setReferenceType(StockMovementReferenceType.SYSTEM);
        movement.setReferenceId(inventory.getWarehouse().getId());
        movement.setReferenceNumber(null);
        movement.setReferenceNote(note);
        movement.setQuantityBefore(quantityBefore);
        movement.setQuantityAfter(quantityAfter);
        movement.setReservedBefore(reservedBefore);
        movement.setReservedAfter(reservedAfter);
        movement.setAvailableBefore(quantityBefore.subtract(reservedBefore));
        movement.setAvailableAfter(quantityAfter.subtract(reservedAfter));
        movement.setWarehouse(inventory.getWarehouse());
        movement.setProduct(inventory.getProduct());
        movement.setCreatedBy(currentUser);
        movement.setTransportOrder(null);

        StockMovement savedMovement = stockMovementRepository.saveAndFlush(movement);

        auditFacade.recordCreate("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement));
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "movementType", null, savedMovement.getMovementType());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "quantity", null, savedMovement.getQuantity());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "warehouseId", null, savedMovement.getWarehouse().getId());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "productId", null, savedMovement.getProduct().getId());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "quantityBefore", null, savedMovement.getQuantityBefore());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "quantityAfter", null, savedMovement.getQuantityAfter());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "reservedBefore", null, savedMovement.getReservedBefore());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedMovement.getId(), stockMovementIdentifier(savedMovement), "reservedAfter", null, savedMovement.getReservedAfter());
    }

    private BigDecimal resolveMovementQuantity(BigDecimal quantityBefore, BigDecimal quantityAfter, BigDecimal reservedBefore, BigDecimal reservedAfter) {
        BigDecimal quantityDelta = quantityAfter.subtract(quantityBefore).abs();
        BigDecimal reservedDelta = reservedAfter.subtract(reservedBefore).abs();
        return quantityDelta.compareTo(BigDecimal.ZERO) > 0 ? quantityDelta : reservedDelta;
    }

    private String inventoryIdentifier(WarehouseInventory inventory) {
        return "warehouseId=" + inventory.getWarehouse().getId()
                + ",productId=" + inventory.getProduct().getId();
    }

    private String stockMovementIdentifier(StockMovement movement) {
        return "warehouseId=" + movement.getWarehouse().getId()
                + ",productId=" + movement.getProduct().getId()
                + ",movementId=" + movement.getId();
    }

    private void validateWarehouseCapacity(Warehouse warehouse, BigDecimal quantityBefore, BigDecimal quantityAfter) {
        if (!appProperties.isWarehouseCapacityValidationEnabled()
                || warehouse == null
                || warehouse.getCapacity() == null
                || quantityAfter.compareTo(quantityBefore) <= 0) {
            return;
        }

        BigDecimal currentWarehouseQuantity = QueryParameterNormalizer.zeroIfNull(warehouseInventoryRepository.sumQuantityByWarehouseId(warehouse.getId()));
        BigDecimal projectedWarehouseQuantity = currentWarehouseQuantity.subtract(QueryParameterNormalizer.zeroIfNull(quantityBefore)).add(QueryParameterNormalizer.zeroIfNull(quantityAfter));

        if (projectedWarehouseQuantity.compareTo(warehouse.getCapacity()) > 0) {
            throw new BadRequestException("Warehouse capacity exceeded. Current quantity: "
                    + currentWarehouseQuantity
                    + ", requested quantity after change: "
                    + projectedWarehouseQuantity
                    + ", capacity: "
                    + warehouse.getCapacity());
        }
    }

    private BigDecimal positiveQuantity(BigDecimal quantity, String message) {
        BigDecimal value = QueryParameterNormalizer.zeroIfNull(quantity);
        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(message);
        }
        return value;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }

        String normalized = status.trim().toUpperCase();
        if (!"LOW_STOCK".equals(normalized)
                && !"SUFFICIENT".equals(normalized)
                && !"RESERVED".equals(normalized)
                && !"OUT_OF_STOCK".equals(normalized)
                && !"AVAILABLE".equals(normalized)) {
            throw new BadRequestException("Unsupported inventory status filter");
        }

        return normalized;
    }
}
