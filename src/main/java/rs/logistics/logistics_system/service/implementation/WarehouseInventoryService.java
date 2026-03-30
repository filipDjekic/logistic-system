package rs.logistics.logistics_system.service.implementation;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
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
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
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

    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public WarehouseInventoryResponse create(WarehouseInventoryCreate dto) {
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        checkIfExists(dto.getWarehouseId(), dto.getProductId());
        checkQuantity(dto.getQuantity());

        WarehouseInventory inventory = WarehouseInventoryMapper.toEntity(dto, warehouse, product);
        warehouseInventoryRepository.save(inventory);

        activityLogService.create(new ActivityLogCreate(
                "WAREHOUSE_INVENTORY",
                "CREATE",
                inventory.getId().getWarehouseId(),
                "WAREHOUSE INVENTORY is created (ID: " + inventory.getId() + " | " + inventory.getId().getProductId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

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

        WarehouseInventoryMapper.updateEntity(dto, warehouse, product, inventory);
        warehouseInventoryRepository.save(inventory);

        activityLogService.create(new ActivityLogCreate(
                "WAREHOUSE_INVENTORY",
                "UPDATE",
                inventory.getId().getWarehouseId(),
                "WAREHOUSE INVENTORY is created (ID: " + inventory.getId().getWarehouseId() + " | " + inventory.getId().getProductId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        notifyLowStockIfNeeded(inventory);

        return WarehouseInventoryMapper.toResponse(inventory);
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

        if (inventory.getReservedQuantity() != null && inventory.getReservedQuantity().compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Warehouse inventory with reserved quantity cannot be deleted");
        }

        activityLogService.create(new ActivityLogCreate(
                "WAREHOUSE_INVENTORY",
                "DELETE",
                inventory.getId().getWarehouseId(),
                "WAREHOUSE INVENTORY is deleted (ID: " + inventory.getId().getWarehouseId() + " | " + inventory.getId().getProductId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        warehouseInventoryRepository.delete(inventory);
    }

    @Transactional
    @Override
    public void reserveStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));
        inventory.reserve(quantity);
        notifyLowStockIfNeeded(inventory);

        warehouseInventoryRepository.save(inventory);
    }

    @Transactional
    @Override
    public void releaseReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        inventory.release(quantity);

        warehouseInventoryRepository.save(inventory);
    }

    @Transactional
    @Override
    public void moveOutReservedStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));

        BigDecimal reserved = inventory.getReservedQuantity() == null ? BigDecimal.ZERO : inventory.getReservedQuantity();

        if (reserved.compareTo(quantity) < 0) {
            throw new BadRequestException("Not enough reserved stock");
        }

        inventory.moveOutReserved(quantity);
        notifyLowStockIfNeeded(inventory);

        warehouseInventoryRepository.save(inventory);
    }

    @Transactional
    @Override
    public void moveInStock(Long warehouseId, Long productId, BigDecimal quantity) {
        checkMovementQuantity(quantity);

        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId).orElseGet(() -> {
                    Warehouse warehouse = warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
                    Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

                    WarehouseInventory newInventory = new WarehouseInventory(
                            warehouse,
                            product,
                            BigDecimal.ZERO,
                            BigDecimal.ZERO
                    );
                    newInventory.setReservedQuantity(BigDecimal.ZERO);

                    return warehouseInventoryRepository.save(newInventory);
                });

        inventory.increase(quantity);

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
        BigDecimal quantity = inventory.getQuantity() == null ? BigDecimal.ZERO : inventory.getQuantity();

        if (quantity.compareTo(inventory.getMinStockLevel()) <= 0) {
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
}
