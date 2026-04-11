package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.ChangeType;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.StockMovementMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.*;

import java.math.BigDecimal;
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
    private final TransportOrderRepository _transportOrderRepository;

    private final WarehouseInventoryRepository _warehouseInventoryRepository;

    private final WarehouseInventoryServiceDefinition warehouseInventoryService;
    private final AuditFacadeDefinition auditFacade;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public StockMovementResponse create(StockMovementCreate dto) {
        Warehouse warehouse = authenticatedUserProvider.isOverlord()
                ? _warehouseRepository.findById(dto.getWarehouseId())
                  .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"))
                : _warehouseRepository.findByIdAndCompany_Id(
                dto.getWarehouseId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        Product product = authenticatedUserProvider.isOverlord()
                ? _productRepository.findById(dto.getProductId())
                  .orElseThrow(() -> new ResourceNotFoundException("Product not found"))
                : _productRepository.findByIdAndCompany_Id(
                dto.getProductId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        User user = _userRepository.findById(authenticatedUserProvider.getAuthenticatedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TransportOrder transportOrder = null;
        if (dto.getTransportOrderId() != null) {
            transportOrder = authenticatedUserProvider.isOverlord()
                    ? _transportOrderRepository.findById(dto.getTransportOrderId())
                      .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"))
                    : _transportOrderRepository.findByIdAndCreatedBy_Company_Id(
                    dto.getTransportOrderId(),
                    authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
            ).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));
        }

        validateWarehouseAndProductSameCompany(warehouse, product);

        if (!authenticatedUserProvider.isOverlord()) {
            authenticatedUserProvider.ensureCompanyAccess(
                    user.getCompany() != null ? user.getCompany().getId() : null
            );
        }

        validateMovementRequest(dto, warehouse, product, transportOrder);

        WarehouseInventory inventory = getOrCreateInventoryForMovement(
                warehouse,
                product,
                dto.getMovementType()
        );

        BigDecimal quantityBefore = getSafeQuantity(inventory.getQuantity());
        BigDecimal reservedBefore = getSafeQuantity(inventory.getReservedQuantity());
        BigDecimal availableBefore = quantityBefore.subtract(reservedBefore);

        switch (dto.getMovementType()) {
            case INBOUND:
            case TRANSFER_IN:
                increaseInventory(inventory, dto.getQuantity());
                break;

            case OUTBOUND:
                decreaseInventory(inventory, dto.getQuantity());
                break;

            case TRANSFER_OUT:
                dispatchReservedInventory(inventory, dto.getQuantity());
                break;

            case ADJUSTMENT:
                adjustInventory(inventory, dto.getQuantity());
                break;

            default:
                throw new BadRequestException("Unsupported stock movement type");
        }

        WarehouseInventory savedInventory = _warehouseInventoryRepository.save(inventory);

        BigDecimal quantityAfter = getSafeQuantity(savedInventory.getQuantity());
        BigDecimal reservedAfter = getSafeQuantity(savedInventory.getReservedQuantity());
        BigDecimal availableAfter = quantityAfter.subtract(reservedAfter);

        StockMovement stockMovement = StockMovementMapper.toEntity(
                dto,
                warehouse,
                product,
                user,
                transportOrder,
                quantityBefore,
                quantityAfter,
                reservedBefore,
                reservedAfter,
                availableBefore,
                availableAfter
        );

        StockMovement saved = _stockMovementRepository.save(stockMovement);

        auditFacade.recordCreate("STOCK_MOVEMENT", saved.getId());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), "quantityBefore", quantityBefore, quantityAfter);
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), "reservedBefore", reservedBefore, reservedAfter);
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), "availableBefore", availableBefore, availableAfter);
        auditFacade.log(
                "CREATE",
                "STOCK_MOVEMENT",
                saved.getId(),
                "Stock movement created (ID: " + saved.getId()
                        + ", type: " + saved.getMovementType()
                        + ", quantity: " + saved.getQuantity()
                        + ", reason: " + saved.getReasonCode()
                        + ", before: " + quantityBefore
                        + ", after: " + quantityAfter + ")"
        );

        warehouseInventoryService.checkLowStockAndNotify(savedInventory);

        return StockMovementMapper.toResponse(saved);
    }

    @Override
    public StockMovementResponse getById(Long id) {
        StockMovement stockMovement = authenticatedUserProvider.isOverlord()
                ? _stockMovementRepository.findById(id)
                  .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"))
                : _stockMovementRepository.findByIdAndWarehouse_Company_Id(
                id,
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ).orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"));

        return StockMovementMapper.toResponse(stockMovement);
    }

    @Override
    public List<StockMovementResponse> getAll() {
        List<StockMovement> data = authenticatedUserProvider.isOverlord()
                ? _stockMovementRepository.findAll()
                : _stockMovementRepository.findAllByWarehouse_Company_Id(
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        );

        return data.stream()
                .map(StockMovementMapper::toResponse)
                .collect(Collectors.toList());
    }

    // helpers

    private void increaseInventory(WarehouseInventory inventory, BigDecimal quantity) {
        inventory.increase(quantity);

        auditFacade.log(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                "Inventory increased (WAREHOUSE ID: " + inventory.getWarehouse().getId()
                        + ", PRODUCT ID: " + inventory.getProduct().getId()
                        + ", QUANTITY: " + quantity + ")"
        );
    }

    private void decreaseInventory(WarehouseInventory inventory, BigDecimal quantity) {
        BigDecimal available = getAvailableQuantity(inventory);

        if (available.compareTo(quantity) < 0) {
            throw new BadRequestException("Not enough available stock");
        }

        inventory.decrease(quantity);

        auditFacade.log(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                "Inventory decreased (WAREHOUSE ID: " + inventory.getWarehouse().getId()
                        + ", PRODUCT ID: " + inventory.getProduct().getId()
                        + ", QUANTITY: " + quantity + ")"
        );
    }

    private void dispatchReservedInventory(WarehouseInventory inventory, BigDecimal quantity) {
        BigDecimal reserved = getSafeQuantity(inventory.getReservedQuantity());

        if (reserved.compareTo(quantity) < 0) {
            throw new BadRequestException("Not enough reserved stock for transport dispatch");
        }

        inventory.release(quantity);
        inventory.decrease(quantity);

        auditFacade.log(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                "Reserved inventory dispatched (WAREHOUSE ID: " + inventory.getWarehouse().getId()
                        + ", PRODUCT ID: " + inventory.getProduct().getId()
                        + ", QUANTITY: " + quantity + ")"
        );
    }

    private void adjustInventory(WarehouseInventory inventory, BigDecimal quantity) {
        validateAdjustment(inventory, quantity);

        inventory.adjustTo(quantity);

        auditFacade.log(
                "UPDATE",
                "WAREHOUSE_INVENTORY",
                inventory.getWarehouse().getId(),
                "Inventory adjusted (WAREHOUSE ID: " + inventory.getWarehouse().getId()
                        + ", PRODUCT ID: " + inventory.getProduct().getId()
                        + ", NEW QUANTITY: " + quantity + ")"
        );
    }

    private void checkMovementQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
    }

    private WarehouseInventory getOrCreateInventoryForMovement(Warehouse warehouse, Product product, StockMovementType movementType) {
        WarehouseInventory inventory = authenticatedUserProvider.isOverlord()
                ? _warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())
                  .orElseGet(() -> {
                      if (movementType != StockMovementType.INBOUND &&
                          movementType != StockMovementType.TRANSFER_IN &&
                          movementType != StockMovementType.ADJUSTMENT) {
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
                  })
                : _warehouseInventoryRepository.findByWarehouse_IdAndProduct_IdAndWarehouse_Company_Id(
                warehouse.getId(),
                product.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        )
                  .orElseGet(() -> {
                      if (movementType != StockMovementType.INBOUND &&
                          movementType != StockMovementType.TRANSFER_IN &&
                          movementType != StockMovementType.ADJUSTMENT) {
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

        validateInventoryOperationalContext(inventory);
        return inventory;
    }

    private void validateMovementRequest(StockMovementCreate dto, Warehouse warehouse, Product product, TransportOrder transportOrder) {
        if (dto == null) {
            throw new BadRequestException("Stock movement request is required");
        }

        if (dto.getMovementType() == null) {
            throw new BadRequestException("Movement type is required");
        }

        if (dto.getReasonCode() == null) {
            throw new BadRequestException("Reason code is required");
        }

        if (dto.getReferenceType() == null) {
            throw new BadRequestException("Reference type is required");
        }

        checkMovementQuantity(dto.getQuantity());

        validateWarehouseOperational(warehouse);
        validateProductOperational(product);

        if (dto.getMovementType() == StockMovementType.ADJUSTMENT) {
            if (dto.getReferenceNote() == null || dto.getReferenceNote().trim().length() < 5) {
                throw new BadRequestException("Adjustment must contain a meaningful reference note");
            }

            if (dto.getReasonCode() != StockMovementReasonCode.INVENTORY_ADJUSTMENT &&
                    dto.getReasonCode() != StockMovementReasonCode.CORRECTION) {
                throw new BadRequestException("Invalid reason code for adjustment");
            }
        }

        if (dto.getMovementType() == StockMovementType.TRANSFER_OUT ||
                dto.getMovementType() == StockMovementType.TRANSFER_IN) {
            if (transportOrder == null) {
                throw new BadRequestException("Transport order is required for transfer movement");
            }

            if (dto.getReferenceType() != StockMovementReferenceType.TRANSPORT_ORDER) {
                throw new BadRequestException("Transfer movement must use TRANSPORT_ORDER reference type");
            }

            if (dto.getMovementType() == StockMovementType.TRANSFER_OUT &&
                    !transportOrder.getSourceWarehouse().getId().equals(warehouse.getId())) {
                throw new BadRequestException("TRANSFER_OUT warehouse must match transport source warehouse");
            }

            if (dto.getMovementType() == StockMovementType.TRANSFER_IN &&
                    !transportOrder.getDestinationWarehouse().getId().equals(warehouse.getId())) {
                throw new BadRequestException("TRANSFER_IN warehouse must match transport destination warehouse");
            }

            if (dto.getReasonCode() != StockMovementReasonCode.TRANSPORT_DISPATCH &&
                    dto.getReasonCode() != StockMovementReasonCode.TRANSPORT_RECEIPT) {
                throw new BadRequestException("Invalid reason code for transport movement");
            }
        }

        if (dto.getReferenceNumber() != null && dto.getReferenceNumber().trim().isEmpty()) {
            throw new BadRequestException("Reference number cannot be blank");
        }

        if (dto.getReasonDescription() != null && dto.getReasonDescription().trim().isEmpty()) {
            throw new BadRequestException("Reason description cannot be blank");
        }

        if (dto.getReferenceNote() != null && dto.getReferenceNote().trim().isEmpty()) {
            throw new BadRequestException("Reference note cannot be blank");
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

    private BigDecimal getSafeQuantity(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private void validateWarehouseOperational(Warehouse warehouse) {
        if (warehouse == null || warehouse.getId() == null) {
            throw new BadRequestException("Warehouse is required");
        }

        if (!warehouse.isOperational()) {
            throw new BadRequestException("Warehouse is not operational for stock operations");
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

    private void validateWarehouseAndProductSameCompany(Warehouse warehouse, Product product) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        authenticatedUserProvider.ensureSameCompany(
                warehouse.getCompany() != null ? warehouse.getCompany().getId() : null,
                product.getCompany() != null ? product.getCompany().getId() : null,
                "Warehouse and product must belong to the same company"
        );
    }
}