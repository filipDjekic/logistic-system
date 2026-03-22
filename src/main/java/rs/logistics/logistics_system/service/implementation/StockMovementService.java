package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.StockMovementUpdate;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.ChangeType;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.StockMovementMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class StockMovementService implements StockMovementServiceDefinition {

    private final StockMovementRepository _stockMovementRepository;
    private final WarehouseRepository _warehouseRepository;
    private final ProductRepository _productRepository;
    private final UserRepository _userRepository;

    private final WarehouseInventoryRepository _warehouseInventoryRepository;
    private final ActivityLogServiceDefinition activityLogService;
    private final ChangeHistoryServiceDefinition changeHistoryService;

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public StockMovementResponse create(StockMovementCreate dto) {
        if (authenticatedUserProvider.getAuthenticatedUserId() == null) {
            throw new BadRequestException("Authenticated user is required");
        }

        Warehouse warehouse = _warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        Product product = _productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        User user = _userRepository.findById(authenticatedUserProvider.getAuthenticatedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateMovementRequest(dto, warehouse, product);

        WarehouseInventory inventory = getOrCreateInventoryForInbound(
                warehouse,
                product,
                dto.getMovementType()
        );

        BigDecimal beforeQuantity = inventory.getQuantity();

        switch (dto.getMovementType()) {
            case INBOUND:
            case TRANSFER_IN:
                increaseInventory(inventory, dto.getQuantity());
                break;

            case OUTBOUND:
            case TRANSFER_OUT:
                decreaseInventory(inventory, dto.getQuantity());
                break;

            case ADJUSTMENT:
                adjustInventory(inventory, dto.getQuantity());
                break;

            default:
                throw new BadRequestException("Unsupported stock movement type");
        }

        _warehouseInventoryRepository.save(inventory);

        BigDecimal afterQuantity = inventory.getQuantity();

        StockMovement stockMovement = StockMovementMapper.toEntity(dto, warehouse, product, user);
        StockMovement saved = _stockMovementRepository.save(stockMovement);

        changeHistoryService.create(new ChangeHistoryCreate(
                "STOCK_MOVEMENT",
                saved.getId(),
                ChangeType.CREATE,
                "quantity",
                beforeQuantity.toString(),
                afterQuantity.toString(),
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "STOCK_MOVEMENT",
                saved.getId(),
                "Stock movement created (ID: " + saved.getId() + ", type: " + saved.getMovementType()
                        + ", quantity: " + saved.getQuantity() + ", before: " + beforeQuantity
                        + ", after: " + afterQuantity + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return StockMovementMapper.toResponse(saved);
    }

    @Override
    public StockMovementResponse getById(Long id) {
        StockMovement stockMovement =  _stockMovementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"));
        return StockMovementMapper.toResponse(stockMovement);
    }

    @Override
    public List<StockMovementResponse> getAll() {
        return _stockMovementRepository.findAll().stream().map(StockMovementMapper::toResponse).collect(Collectors.toList());
    }

    // helpers

    private void increaseInventory(WarehouseInventory inventory, BigDecimal quantity) {
        inventory.increase(quantity);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                "Inventory increased (WAREHOUSE ID: " + inventory.getWarehouse().getId()
                        + ", PRODUCT ID: " + inventory.getProduct().getId()
                        + ", QUANTITY: " + quantity + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    private void decreaseInventory(WarehouseInventory inventory, BigDecimal quantity) {
        BigDecimal available = getAvailableQuantity(inventory);

        if (available.compareTo(quantity) < 0) {
            throw new BadRequestException("Not enough available stock");
        }

        inventory.decrease(quantity);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                "Inventory decreased (WAREHOUSE ID: " + inventory.getWarehouse().getId()
                        + ", PRODUCT ID: " + inventory.getProduct().getId()
                        + ", QUANTITY: " + quantity + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    private void adjustInventory(WarehouseInventory inventory, BigDecimal quantity) {
        validateAdjustment(inventory, quantity);

        inventory.adjustTo(quantity);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                "Inventory adjusted (WAREHOUSE ID: " + inventory.getWarehouse().getId()
                        + ", PRODUCT ID: " + inventory.getProduct().getId()
                        + ", NEW QUANTITY: " + quantity + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }


    private void checkMovementQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
    }

    private WarehouseInventory getOrCreateInventoryForInbound(
            Warehouse warehouse,
            Product product,
            StockMovementType movementType
    ) {
        return _warehouseInventoryRepository
                .findByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())
                .orElseGet(() -> {
                    if (movementType != StockMovementType.INBOUND) {
                        throw new ResourceNotFoundException("Inventory not found");
                    }

                    WarehouseInventory newInventory = new WarehouseInventory(
                            warehouse,
                            product,
                            BigDecimal.ZERO,
                            BigDecimal.ZERO
                    );
                    newInventory.setReservedQuantity(BigDecimal.ZERO);

                    return _warehouseInventoryRepository.save(newInventory);
                });
    }

    private void validateMovementRequest(
            StockMovementCreate dto,
            Warehouse warehouse,
            Product product
    ) {
        if (dto == null) {
            throw new BadRequestException("Stock movement request is required");
        }

        if (dto.getMovementType() == null) {
            throw new BadRequestException("Movement type is required");
        }

        checkMovementQuantity(dto.getQuantity());

        if (warehouse == null || warehouse.getId() == null) {
            throw new BadRequestException("Warehouse is required");
        }

        if (!Boolean.TRUE.equals(warehouse.getActive())) {
            throw new BadRequestException("Warehouse is not active");
        }

        if (warehouse.getStatus() != WarehouseStatus.ACTIVE) {
            throw new BadRequestException("Warehouse is not available for stock operations");
        }

        if (product == null || product.getId() == null) {
            throw new BadRequestException("Product is required");
        }

        if (dto.getReferenceNote() == null || dto.getReferenceNote().trim().isEmpty()) {
            throw new BadRequestException("Reference note is required");
        }

        if (dto.getMovementType() == StockMovementType.ADJUSTMENT &&
                dto.getReferenceNote().trim().length() < 5) {
            throw new BadRequestException("Adjustment must contain a meaningful reference note");
        }
    }

    private void validateAdjustment(WarehouseInventory inventory, BigDecimal newQuantity) {
        if (newQuantity == null || newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Adjusted quantity cannot be negative");
        }

        if (inventory.getReservedQuantity() != null &&
                newQuantity.compareTo(inventory.getReservedQuantity()) < 0) {
            throw new BadRequestException("Adjusted quantity cannot be lower than reserved quantity");
        }
    }

    private BigDecimal getAvailableQuantity(WarehouseInventory inventory) {
        BigDecimal quantity = inventory.getQuantity() == null ? BigDecimal.ZERO : inventory.getQuantity();
        BigDecimal reserved = inventory.getReservedQuantity() == null ? BigDecimal.ZERO : inventory.getReservedQuantity();

        return quantity.subtract(reserved);
    }

}
