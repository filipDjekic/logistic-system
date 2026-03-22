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
        Warehouse warehouse = _warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        WarehouseInventory inventory = _warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId()).orElseGet(() -> {

            if (dto.getMovementType() != StockMovementType.INBOUND) {
                throw new ResourceNotFoundException("Inventory not found");
            }

            WarehouseInventory newInventory = new WarehouseInventory(
                    warehouse,
                    product,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            );

            return _warehouseInventoryRepository.save(newInventory);
        });

        checkMovementQuantity(dto.getQuantity());
        switch(dto.getMovementType()) {
            case StockMovementType.INBOUND:
                increaseInventory(inventory, dto.getQuantity());
                break;
            case StockMovementType.OUTBOUND:
                decreaseInventory(inventory, dto.getQuantity());
                break;
            case StockMovementType.TRANSFER_OUT:
                decreaseInventory(inventory, dto.getQuantity());
                break;
            case StockMovementType.TRANSFER_IN:
                increaseInventory(inventory, dto.getQuantity());
                break;
            case StockMovementType.ADJUSTMENT:
                adjustInventory(inventory, dto.getQuantity());
                break;
        }
        _warehouseInventoryRepository.save(inventory);

        User user = _userRepository.findById(authenticatedUserProvider.getAuthenticatedUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        StockMovement stockMovement = StockMovementMapper.toEntity(dto, warehouse, product, user);
        StockMovement saved = _stockMovementRepository.save(stockMovement);

        changeHistoryService.create(new ChangeHistoryCreate(
                "STOCK_MOVEMENT",
                saved.getId(),
                ChangeType.CREATE,
                "ENTITY",
                "null",
                "INITIAL_STATE",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "STOCK_MOVEMENT",
                saved.getId(),
                "STOCK_MOVEMENT is created (ID: " + saved.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return StockMovementMapper.toResponse(saved);
    }

    @Override
    public StockMovementResponse update(Long id, StockMovementUpdate dto) {
        Warehouse warehouse = _warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = _userRepository.findById(authenticatedUserProvider.getAuthenticatedUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        StockMovement stockMovement = _stockMovementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"));

        StockMovementMapper.updateEntity(stockMovement, dto, warehouse, product, user);
        StockMovement saved = _stockMovementRepository.save(stockMovement);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "STOCK_MOVEMENT",
                saved.getId(),
                "STOCK_MOVEMENT is updated (ID: " + saved.getId() + ")",
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

    @Override
    public void delete(Long id) {
        StockMovement stockMovement = _stockMovementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"));
        _stockMovementRepository.delete(stockMovement);

        changeHistoryService.create(new ChangeHistoryCreate(
                "STOCK_MOVEMENT",
                id,
                ChangeType.DELETE,
                "ENTITY",
                "INITIAL_STATE",
                "null",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "STOCK_MOVEMENT",
                id,
                "Stock movement being deleted (ID: " + id + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }


    private void increaseInventory(WarehouseInventory inventory, BigDecimal quantity){
        inventory.setQuantity(inventory.getQuantity().add(quantity));

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "STOCK_MOVEMENT",
                inventory.getWarehouse().getId(),
                "Inventory increased (WAREHOUSE ID: " + inventory.getWarehouse().getId() + ", PRODUCT ID: " + inventory.getProduct().getId() + ", QUANTITY: " + quantity + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    private void decreaseInventory(WarehouseInventory inventory, BigDecimal quantity){
        if(inventory.getQuantity().compareTo(quantity) < 0){
            throw new BadRequestException("Not enough in stock");
        }

        inventory.setQuantity(inventory.getQuantity().subtract(quantity));

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "STOCK_MOVEMENT",
                inventory.getWarehouse().getId(),
                "Inventory increased (WAREHOUSE ID: " + inventory.getWarehouse().getId() + ", PRODUCT ID: " + inventory.getProduct().getId() + ", QUANTITY: " + quantity + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    private void adjustInventory(WarehouseInventory inventory, BigDecimal quantity){
        inventory.setQuantity(quantity);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "STOCK_MOVEMENT",
                inventory.getWarehouse().getId(),
                "Inventory adjusted of warehouse(ID: " + inventory.getWarehouse().getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    // helpers

    private void checkMovementQuantity(BigDecimal quantity){
        if(quantity == null ||  quantity.compareTo(BigDecimal.ZERO) <= 0){
            throw new BadRequestException("Quantity must be greater than zero");
        }
    }
}
