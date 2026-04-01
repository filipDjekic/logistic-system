package rs.logistics.logistics_system.service.implementation;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseInventoryService implements WarehouseInventoryServiceDefinition {

    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;

    private final NotificationService notificationService;
    private final AuditFacadeDefinition auditFacade;

    @Override
    @Transactional
    public WarehouseInventoryResponse create(WarehouseInventoryCreate dto) {
        Warehouse warehouse = getValidatedOperationalWarehouse(dto.getWarehouseId());
        Product product = getValidatedOperationalProduct(dto.getProductId());

        checkIfExists(dto.getWarehouseId(), dto.getProductId());
        checkQuantity(dto.getQuantity());

        WarehouseInventory inventory = WarehouseInventoryMapper.toEntity(dto, warehouse, product);
        WarehouseInventory saved = warehouseInventoryRepository.save(inventory);

        String entityIdentifier = inventoryAuditIdentifier(saved);

        auditFacade.recordCreate("WAREHOUSE_INVENTORY", saved.getId().getWarehouseId(), entityIdentifier);
        auditFacade.log(
                "CREATE",
                "WAREHOUSE_INVENTORY",
                saved.getId().getWarehouseId(),
                entityIdentifier,
                "WAREHOUSE INVENTORY is created (WAREHOUSE ID: " + saved.getId().getWarehouseId() + " | PRODUCT ID: " + saved.getId().getProductId() + ")"
        );

        notifyLowStockIfStateChanged(null, null, saved);

        return WarehouseInventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public WarehouseInventoryResponse update(Long warehouseId, Long productId, WarehouseInventoryUpdate dto) {
        Warehouse warehouse = getValidatedOperationalWarehouse(warehouseId);
        Product product = getValidatedOperationalProduct(productId);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        validateInventoryOperationalContext(inventory);
        checkQuantity(dto.getQuantity());

        if (dto.getQuantity().compareTo(inventory.getReservedQuantity()) < 0) {
            throw new BadRequestException("Total quantity cannot be lower than reserved quantity");
        }

        BigDecimal oldQuantity = inventory.getQuantity();
        BigDecimal oldMinStockLevel = inventory.getMinStockLevel();

        WarehouseInventoryMapper.updateEntity(dto, warehouse, product, inventory);
        WarehouseInventory saved = warehouseInventoryRepository.save(inventory);

        String entityIdentifier = inventoryAuditIdentifier(saved);

        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                saved.getId().getWarehouseId(),
                entityIdentifier,
                "quantity",
                oldQuantity,
                saved.getQuantity()
        );
        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                saved.getId().getWarehouseId(),
                entityIdentifier,
                "minStockLevel",
                oldMinStockLevel,
                saved.getMinStockLevel()
        );

        auditFacade.log(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                saved.getId().getWarehouseId(),
                entityIdentifier,
                "WAREHOUSE INVENTORY is updated (WAREHOUSE ID: " + saved.getId().getWarehouseId() + " | PRODUCT ID: " + saved.getId().getProductId() + ")"
        );

        notifyLowStockIfStateChanged(oldQuantity, oldMinStockLevel, saved);

        return WarehouseInventoryMapper.toResponse(saved);
    }

    @Override
    public WarehouseInventoryResponse findByWarehouseAndProduct(Long warehouseId, Long productId) {
        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));
        return WarehouseInventoryMapper.toResponse(inventory);
    }

    @Override
    public List<WarehouseInventoryResponse> findByWarehouse(Long warehouseId) {
        return warehouseInventoryRepository.findByWarehouse_Id(warehouseId).stream().map(WarehouseInventoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WarehouseInventoryResponse> findByProduct(Long productId) {
        return warehouseInventoryRepository.findByProduct_Id(productId).stream().map(WarehouseInventoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long warehouseId, Long productId) {
        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        BigDecimal quantity = inventory.getQuantity() == null ? BigDecimal.ZERO : inventory.getQuantity();
        BigDecimal reservedQuantity = inventory.getReservedQuantity() == null ? BigDecimal.ZERO : inventory.getReservedQuantity();

        if (quantity.compareTo(BigDecimal.ZERO) > 0 || reservedQuantity.compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException(
                    "Warehouse inventory cannot be deleted while stock or active reservations exist.\n" +
                            "Inventory state must not disappear from the system.\n" +
                            "Set quantity and reserved quantity to zero before deletion."
            );
        }

        String entityIdentifier = inventoryAuditIdentifier(inventory);

        auditFacade.recordDelete("WAREHOUSE_INVENTORY", inventory.getId().getWarehouseId(), entityIdentifier);
        auditFacade.log(
                "DELETE",
                "WAREHOUSE_INVENTORY",
                inventory.getId().getWarehouseId(),
                entityIdentifier,
                "WAREHOUSE INVENTORY is deleted (WAREHOUSE ID: " + inventory.getId().getWarehouseId() + " | PRODUCT ID: " + inventory.getId().getProductId() + ")"
        );

        warehouseInventoryRepository.delete(inventory);
    }

    @Override
    @Transactional
    public void reserveStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);
        getValidatedOperationalWarehouse(warehouseId);
        getValidatedOperationalProduct(productId);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        validateInventoryOperationalContext(inventory);

        BigDecimal oldReservedQuantity = inventory.getReservedQuantity();
        inventory.reserve(quantity);

        String entityIdentifier = inventoryAuditIdentifier(inventory);

        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "reservedQuantity",
                oldReservedQuantity,
                inventory.getReservedQuantity()
        );
        auditFacade.log(
                "RESERVE_STOCK",
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "Reserved stock for PRODUCT ID: " + productId + " in WAREHOUSE ID: " + warehouseId + " by quantity " + quantity
        );

        warehouseInventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public void releaseReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);
        getValidatedOperationalWarehouse(warehouseId);
        getValidatedOperationalProduct(productId);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        validateInventoryOperationalContext(inventory);

        BigDecimal oldReservedQuantity = inventory.getReservedQuantity();
        inventory.release(quantity);

        String entityIdentifier = inventoryAuditIdentifier(inventory);

        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "reservedQuantity",
                oldReservedQuantity,
                inventory.getReservedQuantity()
        );
        auditFacade.log(
                "RELEASE_RESERVED_STOCK",
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "Released reserved stock for PRODUCT ID: " + productId + " in WAREHOUSE ID: " + warehouseId + " by quantity " + quantity
        );

        warehouseInventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public void moveOutReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);
        getValidatedOperationalWarehouse(warehouseId);
        getValidatedOperationalProduct(productId);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        validateInventoryOperationalContext(inventory);

        BigDecimal oldQuantity = inventory.getQuantity();
        BigDecimal oldReservedQuantity = inventory.getReservedQuantity();

        BigDecimal reserved = inventory.getReservedQuantity() == null ? BigDecimal.ZERO : inventory.getReservedQuantity();

        if (reserved.compareTo(quantity) < 0) {
            throw new BadRequestException("Not enough reserved stock");
        }

        inventory.moveOutReserved(quantity);

        BigDecimal oldMinStockLevel = inventory.getMinStockLevel();

        String entityIdentifier = inventoryAuditIdentifier(inventory);

        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "quantity",
                oldQuantity,
                inventory.getQuantity()
        );
        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "reservedQuantity",
                oldReservedQuantity,
                inventory.getReservedQuantity()
        );
        auditFacade.log(
                "MOVE_OUT_RESERVED_STOCK",
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "Moved out reserved stock for PRODUCT ID: " + productId + " in WAREHOUSE ID: " + warehouseId + " by quantity " + quantity
        );

        notifyLowStockIfStateChanged(oldQuantity, oldMinStockLevel, inventory);

        warehouseInventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public void moveInStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        Warehouse warehouse = getValidatedOperationalWarehouse(warehouseId);
        Product product = getValidatedOperationalProduct(productId);

        final boolean[] newlyCreated = {false};

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseGet(() -> {
                    WarehouseInventory newInventory = new WarehouseInventory(
                            warehouse,
                            product,
                            BigDecimal.ZERO,
                            BigDecimal.ZERO
                    );
                    newInventory.setReservedQuantity(BigDecimal.ZERO);
                    newlyCreated[0] = true;
                    return warehouseInventoryRepository.save(newInventory);
                });

        validateInventoryOperationalContext(inventory);

        BigDecimal oldQuantity = inventory.getQuantity();
        inventory.increase(quantity);

        String entityIdentifier = inventoryAuditIdentifier(inventory);

        if (newlyCreated[0]) {
            auditFacade.recordCreate("WAREHOUSE_INVENTORY", warehouseId, entityIdentifier);
        }

        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "quantity",
                oldQuantity,
                inventory.getQuantity()
        );
        auditFacade.log(
                "MOVE_IN_STOCK",
                "WAREHOUSE_INVENTORY",
                warehouseId,
                entityIdentifier,
                "Moved in stock for PRODUCT ID: " + productId + " in WAREHOUSE ID: " + warehouseId + " by quantity " + quantity
        );

        warehouseInventoryRepository.save(inventory);
    }

    @Override
    public void checkLowStockAndNotify(WarehouseInventory inventory) {
        if (inventory == null) {
            return;
        }

        if (!isLowStockNotificationEligible(inventory)) {
            return;
        }

        createLowStockNotification(inventory);
    }


    // helpers

    private void checkIfExists(Long warehouseId, Long productId) {
        if(warehouseInventoryRepository.existsByWarehouse_IdAndProduct_Id(warehouseId, productId)) {
            throw new ConflictException("Warehouse inventory already exists");
        }
    }

    private void checkQuantity(BigDecimal quantity) {
        if(quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Quantity cannot be less than zero");
        }
    }

    private void checkMovementQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
    }

    private void notifyLowStockIfNeeded(WarehouseInventory inventory) {
        if (inventory == null) {
            return;
        }

        BigDecimal quantity = inventory.getQuantity() == null ? BigDecimal.ZERO : inventory.getQuantity();
        BigDecimal minStockLevel = inventory.getMinStockLevel();

        if (minStockLevel == null) {
            return;
        }

        if (quantity.compareTo(minStockLevel) <= 0) {
            if (inventory.getWarehouse() != null && inventory.getWarehouse().getManager() != null && inventory.getWarehouse().getManager().getUser() != null) {

                notificationService.createSystemNotification(
                        inventory.getWarehouse().getManager().getUser().getId(),
                        "Low stock alert",
                        "Product '" + inventory.getProduct().getName() + "' is low on stock in warehouse '" +
                                inventory.getWarehouse().getName() + "'. Current quantity: " + quantity,
                        NotificationType.WARNING
                );
            }
        }
    }

    private String inventoryAuditIdentifier(WarehouseInventory inventory) {
        return inventory.getId().toAuditIdentifier();
    }

    private Warehouse getValidatedOperationalWarehouse(Long warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        validateWarehouseOperational(warehouse);
        return warehouse;
    }

    private Product getValidatedOperationalProduct(Long productId) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        validateProductOperational(product);
        return product;
    }

    private void validateWarehouseOperational(Warehouse warehouse) {
        if (warehouse == null || warehouse.getId() == null) {
            throw new BadRequestException("Warehouse is required");
        }

        if (!warehouse.isOperational()) {
            throw new BadRequestException("Warehouse is not operational for inventory operations");
        }
    }

    private void validateProductOperational(Product product) {
        if (product == null || product.getId() == null) {
            throw new BadRequestException("Product is required");
        }

        if (!product.isOperational()) {
            throw new BadRequestException("Product is not active");
        }
    }

    private void validateInventoryOperationalContext(WarehouseInventory inventory) {
        if (inventory == null) {
            throw new BadRequestException("Warehouse inventory is required");
        }

        validateWarehouseOperational(inventory.getWarehouse());
        validateProductOperational(inventory.getProduct());
    }

    private void notifyLowStockIfStateChanged(BigDecimal previousQuantity, BigDecimal previousMinStockLevel, WarehouseInventory inventory) {
        if (inventory == null) {
            return;
        }

        BigDecimal currentQuantity = inventory.getQuantity() == null ? BigDecimal.ZERO : inventory.getQuantity();
        BigDecimal currentMinStockLevel = inventory.getMinStockLevel();

        boolean wasLowStock = previousQuantity != null
                && previousMinStockLevel != null
                && previousQuantity.compareTo(previousMinStockLevel) <= 0;

        boolean isLowStockNow = currentMinStockLevel != null
                && currentQuantity.compareTo(currentMinStockLevel) <= 0;

        if (!isLowStockNow || wasLowStock) {
            return;
        }

        if (!isLowStockNotificationEligible(inventory)) {
            return;
        }

        createLowStockNotification(inventory);
    }

    private boolean isLowStockNotificationEligible(WarehouseInventory inventory) {
        if (inventory == null) {
            return false;
        }

        if (inventory.getMinStockLevel() == null) {
            return false;
        }

        if (inventory.getQuantity() == null) {
            return BigDecimal.ZERO.compareTo(inventory.getMinStockLevel()) <= 0
                    && inventory.getWarehouse() != null
                    && inventory.getWarehouse().getManager() != null
                    && inventory.getWarehouse().getManager().getUser() != null
                    && inventory.getProduct() != null
                    && inventory.getProduct().getName() != null;
        }

        if (inventory.getQuantity().compareTo(inventory.getMinStockLevel()) > 0) {
            return false;
        }

        return inventory.getWarehouse() != null
                && inventory.getWarehouse().getManager() != null
                && inventory.getWarehouse().getManager().getUser() != null
                && inventory.getProduct() != null
                && inventory.getProduct().getName() != null
                && inventory.getWarehouse().getName() != null;
    }

    private void createLowStockNotification(WarehouseInventory inventory) {
        notificationService.createSystemNotification(
                inventory.getWarehouse().getManager().getUser().getId(),
                "Low stock alert",
                "Product '" + inventory.getProduct().getName()
                        + "' is at or below minimum stock level in warehouse '"
                        + inventory.getWarehouse().getName() + "'.",
                NotificationType.WARNING
        );
    }
}
