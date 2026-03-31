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
    public WarehouseInventoryResponse create(WarehouseInventoryCreate dto) {
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        checkIfExists(dto.getWarehouseId(), dto.getProductId());
        checkQuantity(dto.getQuantity());

        WarehouseInventory inventory = WarehouseInventoryMapper.toEntity(dto, warehouse, product);
        warehouseInventoryRepository.save(inventory);

        String entityIdentifier = inventoryAuditIdentifier(inventory);

        auditFacade.recordCreate("WAREHOUSE_INVENTORY", inventory.getId().getWarehouseId(), entityIdentifier);
        auditFacade.log(
                "CREATE",
                "WAREHOUSE_INVENTORY",
                inventory.getId().getWarehouseId(),
                entityIdentifier,
                "WAREHOUSE INVENTORY is created (WAREHOUSE ID: " + inventory.getId().getWarehouseId() + " | PRODUCT ID: " + inventory.getId().getProductId() + ")"
        );

        return WarehouseInventoryMapper.toResponse(inventory);
    }

    @Override
    public WarehouseInventoryResponse update(Long warehouseId, Long productId, WarehouseInventoryUpdate dto) {
        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));
        Warehouse warehouse = warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

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

        notifyLowStockIfNeeded(saved);

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

    @Transactional
    @Override
    public void reserveStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

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

        notifyLowStockIfNeeded(inventory);

        warehouseInventoryRepository.save(inventory);
    }

    @Transactional
    @Override
    public void releaseReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

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

    @Transactional
    @Override
    public void moveOutReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        BigDecimal oldQuantity = inventory.getQuantity();
        BigDecimal oldReservedQuantity = inventory.getReservedQuantity();

        BigDecimal reserved = inventory.getReservedQuantity() == null ? BigDecimal.ZERO : inventory.getReservedQuantity();

        if (reserved.compareTo(quantity) < 0) {
            throw new BadRequestException("Not enough reserved stock");
        }

        inventory.moveOutReserved(quantity);

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

        notifyLowStockIfNeeded(inventory);

        warehouseInventoryRepository.save(inventory);
    }

    @Transactional
    @Override
    public void moveInStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        final boolean[] newlyCreated = {false};

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseGet(() -> {
                    Warehouse warehouse = warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
                    Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

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

        BigDecimal quantity = inventory.getQuantity() == null ? BigDecimal.ZERO : inventory.getQuantity();

        BigDecimal lowStockThreshold = new BigDecimal("10");

        if (quantity.compareTo(lowStockThreshold) > 0) {
            return;
        }

        if (inventory.getWarehouse() == null || inventory.getWarehouse().getManager() == null || inventory.getWarehouse().getManager().getUser() == null) {
            return;
        }

        notificationService.createSystemNotification(
                inventory.getWarehouse().getManager().getUser().getId(),
                "Low stock alert",
                "Product '" + inventory.getProduct().getName() + "' is low on stock in warehouse '" +
                        inventory.getWarehouse().getName() + "'. Current quantity: " + quantity,
                NotificationType.WARNING
        );
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
}
