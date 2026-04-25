package rs.logistics.logistics_system.service.implementation;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
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
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;

@Service
@RequiredArgsConstructor
public class WarehouseInventoryService implements WarehouseInventoryServiceDefinition {

    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuditFacadeDefinition auditFacade;
    private final NotificationServiceDefinition notificationService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional
    public WarehouseInventoryResponse create(WarehouseInventoryCreate dto) {
        Warehouse warehouse = getAccessibleWarehouse(dto.getWarehouseId());
        Product product = getAccessibleProduct(dto.getProductId());

        validateSameCompany(warehouse, product);

        if (warehouseInventoryRepository.existsByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())) {
            throw new BadRequestException("Warehouse inventory already exists for selected warehouse and product");
        }

        WarehouseInventory warehouseInventory = WarehouseInventoryMapper.toEntity(dto, warehouse, product);
        warehouseInventory.setReservedQuantity(BigDecimal.ZERO);

        WarehouseInventory saved = warehouseInventoryRepository.save(warehouseInventory);

        if (defaultZero(saved.getQuantity()).compareTo(BigDecimal.ZERO) > 0) {
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
        Warehouse warehouse = getAccessibleWarehouse(warehouseId);
        Product product = getAccessibleProduct(productId);

        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        BigDecimal oldQuantity = defaultZero(inventory.getQuantity());
        BigDecimal oldReserved = defaultZero(inventory.getReservedQuantity());
        BigDecimal oldMinStock = inventory.getMinStockLevel();

        if (dto.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Quantity cannot be negative");
        }

        BigDecimal reserved = defaultZero(inventory.getReservedQuantity());
        if (dto.getQuantity().compareTo(reserved) < 0) {
            throw new BadRequestException("Quantity cannot be less than reserved quantity");
        }

        dto.setWarehouseId(warehouseId);
        dto.setProductId(productId);

        WarehouseInventoryMapper.updateEntity(dto, warehouse, product, inventory);
        WarehouseInventory saved = warehouseInventoryRepository.save(inventory);

        BigDecimal newQuantity = defaultZero(saved.getQuantity());
        BigDecimal newReserved = defaultZero(saved.getReservedQuantity());

        if (oldQuantity.compareTo(newQuantity) != 0 || oldReserved.compareTo(newReserved) != 0) {
            recordInventoryMovement(
                    saved,
                    StockMovementType.ADJUSTMENT,
                    StockMovementReasonCode.INVENTORY_ADJUSTMENT,
                    "Inventory record updated",
                    oldQuantity,
                    newQuantity,
                    oldReserved,
                    newReserved
            );
        }

        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", warehouse.getId(), inventoryIdentifier(saved), "quantity", oldQuantity, saved.getQuantity());
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", warehouse.getId(), inventoryIdentifier(saved), "reservedQuantity", oldReserved, saved.getReservedQuantity());
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", warehouse.getId(), inventoryIdentifier(saved), "availableQuantity", oldQuantity.subtract(oldReserved), defaultZero(saved.getQuantity()).subtract(defaultZero(saved.getReservedQuantity())));
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
        String normalizedSearch = normalizeSearch(search);
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

        return PageResponse.from(warehouseInventoryRepository
                .searchInventory(companyId, normalizedSearch, warehouseId, productId, normalizedStatus, pageable)
                .map(WarehouseInventoryMapper::toResponse));
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
        Warehouse warehouse = getAccessibleWarehouse(warehouseId);
        Product product = getAccessibleProduct(productId);

        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouse_IdAndProduct_Id(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        BigDecimal reserved = defaultZero(inventory.getReservedQuantity());
        BigDecimal quantity = defaultZero(inventory.getQuantity());

        if (reserved.compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Warehouse inventory cannot be deleted while it has reserved quantity");
        }

        if (quantity.compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Warehouse inventory cannot be deleted while quantity is greater than zero");
        }

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
    public void reserveStock(Long warehouseId, Long productId, BigDecimal quantity) {
        WarehouseInventory inventory = getInventoryForUpdate(warehouseId, productId);

        BigDecimal requested = positiveQuantity(quantity, "Reserve quantity must be greater than zero");
        BigDecimal quantityBefore = defaultZero(inventory.getQuantity());
        BigDecimal reservedBefore = defaultZero(inventory.getReservedQuantity());
        BigDecimal available = quantityBefore.subtract(reservedBefore);

        if (available.compareTo(requested) < 0) {
            throw new BadRequestException("Not enough available quantity to reserve");
        }

        inventory.setReservedQuantity(reservedBefore.add(requested));
        WarehouseInventory saved = warehouseInventoryRepository.save(inventory);

        recordInventoryMovement(
                saved,
                StockMovementType.ADJUSTMENT,
                StockMovementReasonCode.CORRECTION,
                "Reserved quantity increased",
                quantityBefore,
                quantityBefore,
                reservedBefore,
                saved.getReservedQuantity()
        );

        checkLowStockAndNotify(saved);
    }

    @Override
    @Transactional
    public void releaseReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        WarehouseInventory inventory = getInventoryForUpdate(warehouseId, productId);

        BigDecimal requested = positiveQuantity(quantity, "Release quantity must be greater than zero");
        BigDecimal quantityBefore = defaultZero(inventory.getQuantity());
        BigDecimal reservedBefore = defaultZero(inventory.getReservedQuantity());

        if (reservedBefore.compareTo(requested) < 0) {
            throw new BadRequestException("Not enough reserved quantity to release");
        }

        inventory.setReservedQuantity(reservedBefore.subtract(requested));
        WarehouseInventory saved = warehouseInventoryRepository.save(inventory);

        recordInventoryMovement(
                saved,
                StockMovementType.ADJUSTMENT,
                StockMovementReasonCode.CORRECTION,
                "Reserved quantity released",
                quantityBefore,
                quantityBefore,
                reservedBefore,
                saved.getReservedQuantity()
        );
    }

    @Override
    @Transactional
    public void moveOutReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        WarehouseInventory inventory = getInventoryForUpdate(warehouseId, productId);

        BigDecimal requested = positiveQuantity(quantity, "Move-out quantity must be greater than zero");
        BigDecimal reserved = defaultZero(inventory.getReservedQuantity());
        BigDecimal current = defaultZero(inventory.getQuantity());

        if (reserved.compareTo(requested) < 0) {
            throw new BadRequestException("Not enough reserved quantity to move out");
        }

        if (current.compareTo(requested) < 0) {
            throw new BadRequestException("Not enough total quantity to move out");
        }

        BigDecimal quantityBefore = current;
        BigDecimal reservedBefore = reserved;

        inventory.setReservedQuantity(reserved.subtract(requested));
        inventory.setQuantity(current.subtract(requested));

        WarehouseInventory saved = warehouseInventoryRepository.save(inventory);

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
        BigDecimal quantityBefore = defaultZero(inventory.getQuantity());
        BigDecimal reservedBefore = defaultZero(inventory.getReservedQuantity());

        inventory.setQuantity(quantityBefore.add(requested));
        WarehouseInventory saved = warehouseInventoryRepository.save(inventory);

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

        BigDecimal quantity = defaultZero(inventory.getQuantity());
        BigDecimal minStockLevel = defaultZero(inventory.getMinStockLevel());

        if (minStockLevel.compareTo(BigDecimal.ZERO) > 0 && quantity.compareTo(minStockLevel) <= 0) {
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

    private WarehouseInventory getInventoryForUpdate(Long warehouseId, Long productId) {
        Warehouse warehouse = getAccessibleWarehouse(warehouseId);
        Product product = getAccessibleProduct(productId);
        validateSameCompany(warehouse, product);

        return warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));
    }

    private Warehouse getAccessibleWarehouse(Long warehouseId) {
        if (authenticatedUserProvider.isOverlord()) {
            return warehouseRepository.findById(warehouseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        }

        return warehouseRepository.findByIdAndCompany_Id(
                        warehouseId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
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
        movement.setQuantity(quantityAfter.subtract(quantityBefore).abs());
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

        StockMovement savedMovement = stockMovementRepository.save(movement);

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

    private String inventoryIdentifier(WarehouseInventory inventory) {
        return "warehouseId=" + inventory.getWarehouse().getId()
                + ",productId=" + inventory.getProduct().getId();
    }

    private String stockMovementIdentifier(StockMovement movement) {
        return "warehouseId=" + movement.getWarehouse().getId()
                + ",productId=" + movement.getProduct().getId()
                + ",movementId=" + movement.getId();
    }

    private BigDecimal positiveQuantity(BigDecimal quantity, String message) {
        BigDecimal value = defaultZero(quantity);
        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(message);
        }
        return value;
    }

    private String normalizeSearch(String search) {
        if (search == null || search.trim().isBlank()) {
            return null;
        }
        return search.trim();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }

        String normalized = status.trim().toUpperCase();
        if (!"LOW_STOCK".equals(normalized) && !"SUFFICIENT".equals(normalized)) {
            throw new BadRequestException("Unsupported inventory status filter");
        }

        return normalized;
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}