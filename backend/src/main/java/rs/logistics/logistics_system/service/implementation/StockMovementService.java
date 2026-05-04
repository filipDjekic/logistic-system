package rs.logistics.logistics_system.service.implementation;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.dto.create.StockAdjustmentCreate;
import rs.logistics.logistics_system.dto.create.StockInboundCreate;
import rs.logistics.logistics_system.dto.create.StockOutboundCreate;
import rs.logistics.logistics_system.dto.create.StockReturnCreate;
import rs.logistics.logistics_system.dto.create.StockTransferCreate;
import rs.logistics.logistics_system.dto.create.StockWriteOffCreate;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.StockMovementMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockMovementService implements StockMovementServiceDefinition {

    private final StockMovementRepository stockMovementRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final AuditFacadeDefinition auditFacade;
    private final TaskServiceDefinition taskService;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AppProperties appProperties;
    private final TimeServiceDefinition timeService;


    @Override
    @Transactional
    public StockMovementResponse inbound(StockInboundCreate dto) {
        TransportOrder transportOrder = null;
        Warehouse warehouse = getAccessibleWarehouseForUpdate(dto.getWarehouseId());
        if (dto.getTransportOrderId() != null) {
            transportOrder = resolveTransportOrder(dto.getTransportOrderId(), warehouse);
            validateTransferWarehouse(transportOrder, warehouse, false);
        }

        StockMovement saved = applyMovement(
                warehouse,
                getAccessibleProduct(dto.getProductId()),
                dto.getQuantity(),
                StockMovementType.INBOUND,
                dto.getTransportOrderId() != null ? StockMovementReasonCode.TRANSPORT_RECEIPT : StockMovementReasonCode.MANUAL_INBOUND,
                dto.getReasonDescription(),
                dto.getTransportOrderId() != null
                        ? StockMovementReferenceType.TRANSPORT_ORDER
                        : resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getTransportOrderId() != null ? dto.getTransportOrderId() : dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                transportOrder,
                false
        );
        return StockMovementMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockMovementResponse outbound(StockOutboundCreate dto) {
        Warehouse warehouse = getAccessibleWarehouseForUpdate(dto.getWarehouseId());
        TransportOrder transportOrder = dto.getTransportOrderId() != null
                ? resolveTransportOrder(dto.getTransportOrderId(), warehouse)
                : null;
        if (transportOrder != null) {
            validateTransferWarehouse(transportOrder, warehouse, true);
        }

        StockMovement saved = applyMovement(
                warehouse,
                getAccessibleProduct(dto.getProductId()),
                dto.getQuantity(),
                StockMovementType.OUTBOUND,
                dto.getTransportOrderId() != null ? StockMovementReasonCode.TRANSPORT_DISPATCH : StockMovementReasonCode.MANUAL_OUTBOUND,
                dto.getReasonDescription(),
                dto.getTransportOrderId() != null
                        ? StockMovementReferenceType.TRANSPORT_ORDER
                        : resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getTransportOrderId() != null ? dto.getTransportOrderId() : dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                transportOrder,
                false
        );
        return StockMovementMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public List<StockMovementResponse> transfer(StockTransferCreate dto) {
        if (dto.getTransportOrderId() != null) {
            throw new BadRequestException("Transport-linked transfers must be executed through transport order status lifecycle");
        }

        if (dto.getSourceWarehouseId().equals(dto.getDestinationWarehouseId())) {
            throw new BadRequestException("Source and destination warehouse must be different");
        }

        Warehouse firstLockedWarehouse;
        Warehouse secondLockedWarehouse;
        if (dto.getSourceWarehouseId().compareTo(dto.getDestinationWarehouseId()) < 0) {
            firstLockedWarehouse = getAccessibleWarehouseForUpdate(dto.getSourceWarehouseId());
            secondLockedWarehouse = getAccessibleWarehouseForUpdate(dto.getDestinationWarehouseId());
        } else {
            firstLockedWarehouse = getAccessibleWarehouseForUpdate(dto.getDestinationWarehouseId());
            secondLockedWarehouse = getAccessibleWarehouseForUpdate(dto.getSourceWarehouseId());
        }
        Warehouse sourceWarehouse = firstLockedWarehouse.getId().equals(dto.getSourceWarehouseId()) ? firstLockedWarehouse : secondLockedWarehouse;
        Warehouse destinationWarehouse = firstLockedWarehouse.getId().equals(dto.getDestinationWarehouseId()) ? firstLockedWarehouse : secondLockedWarehouse;
        Product product = getAccessibleProduct(dto.getProductId());
        validateSameCompany(sourceWarehouse, product);
        validateSameCompany(destinationWarehouse, product);

        TransportOrder transportOrder = null;
        if (dto.getTransportOrderId() != null) {
            transportOrder = resolveTransportOrder(dto.getTransportOrderId(), sourceWarehouse);
            validateTransferWarehouse(transportOrder, sourceWarehouse, true);
            validateTransferWarehouse(transportOrder, destinationWarehouse, false);
        }

        String transferGroupId = "TRF-GRP-" + UUID.randomUUID();
        String referenceNumber = dto.getReferenceNumber();
        if (referenceNumber == null || referenceNumber.isBlank()) {
            referenceNumber = transferGroupId;
        }

        Long referenceId = dto.getTransportOrderId() != null ? dto.getTransportOrderId() : null;
        StockMovementReferenceType referenceType = dto.getTransportOrderId() != null
                ? StockMovementReferenceType.TRANSPORT_ORDER
                : StockMovementReferenceType.MANUAL;

        StockMovement out = applyMovement(
                sourceWarehouse,
                product,
                dto.getQuantity(),
                StockMovementType.TRANSFER_OUT,
                dto.getTransportOrderId() != null ? StockMovementReasonCode.TRANSPORT_DISPATCH : StockMovementReasonCode.MANUAL_OUTBOUND,
                dto.getReasonDescription(),
                referenceType,
                referenceId,
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                true
        );

        StockMovement in = applyMovement(
                destinationWarehouse,
                product,
                dto.getQuantity(),
                StockMovementType.TRANSFER_IN,
                dto.getTransportOrderId() != null ? StockMovementReasonCode.TRANSPORT_RECEIPT : StockMovementReasonCode.MANUAL_INBOUND,
                dto.getReasonDescription(),
                referenceType,
                referenceId,
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                false
        );

        return List.of(StockMovementMapper.toResponse(out), StockMovementMapper.toResponse(in));
    }


    @Override
    @Transactional
    public StockMovementResponse dispatchTransport(StockTransferCreate dto) {
        validateTransportTransferRequest(dto);

        Warehouse sourceWarehouse = getAccessibleWarehouseForUpdate(dto.getSourceWarehouseId());
        Warehouse destinationWarehouse = getAccessibleWarehouse(dto.getDestinationWarehouseId());
        Product product = getAccessibleProduct(dto.getProductId());
        validateSameCompany(sourceWarehouse, product);
        validateSameCompany(destinationWarehouse, product);

        TransportOrder transportOrder = resolveTransportOrder(dto.getTransportOrderId(), sourceWarehouse);
        validateTransferWarehouse(transportOrder, sourceWarehouse, true);
        validateTransferWarehouse(transportOrder, destinationWarehouse, false);

        String transferGroupId = transportTransferGroupId(transportOrder);
        String referenceNumber = dto.getReferenceNumber();
        if (referenceNumber == null || referenceNumber.isBlank()) {
            referenceNumber = transportOrder.getOrderNumber();
        }

        StockMovement saved = applyMovement(
                sourceWarehouse,
                product,
                dto.getQuantity(),
                StockMovementType.TRANSFER_OUT,
                StockMovementReasonCode.TRANSPORT_DISPATCH,
                dto.getReasonDescription(),
                StockMovementReferenceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                true
        );

        return StockMovementMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockMovementResponse receiveTransport(StockTransferCreate dto) {
        validateTransportTransferRequest(dto);

        Warehouse sourceWarehouse = getAccessibleWarehouse(dto.getSourceWarehouseId());
        Warehouse destinationWarehouse = getAccessibleWarehouseForUpdate(dto.getDestinationWarehouseId());
        Product product = getAccessibleProduct(dto.getProductId());
        validateSameCompany(sourceWarehouse, product);
        validateSameCompany(destinationWarehouse, product);

        TransportOrder transportOrder = resolveTransportOrder(dto.getTransportOrderId(), destinationWarehouse);
        validateTransferWarehouse(transportOrder, sourceWarehouse, true);
        validateTransferWarehouse(transportOrder, destinationWarehouse, false);

        String transferGroupId = transportTransferGroupId(transportOrder);
        String referenceNumber = dto.getReferenceNumber();
        if (referenceNumber == null || referenceNumber.isBlank()) {
            referenceNumber = transportOrder.getOrderNumber();
        }

        StockMovement saved = applyMovement(
                destinationWarehouse,
                product,
                dto.getQuantity(),
                StockMovementType.TRANSFER_IN,
                StockMovementReasonCode.TRANSPORT_RECEIPT,
                dto.getReasonDescription(),
                StockMovementReferenceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                false
        );

        return StockMovementMapper.toResponse(saved);
    }


    @Override
    @Transactional
    public StockMovementResponse returnFailedTransportToSource(StockTransferCreate dto) {
        validateTransportTransferRequest(dto);

        Warehouse sourceWarehouse = getAccessibleWarehouseForUpdate(dto.getSourceWarehouseId());
        Warehouse destinationWarehouse = getAccessibleWarehouse(dto.getDestinationWarehouseId());
        Product product = getAccessibleProduct(dto.getProductId());
        validateSameCompany(sourceWarehouse, product);
        validateSameCompany(destinationWarehouse, product);

        TransportOrder transportOrder = resolveTransportOrder(dto.getTransportOrderId(), sourceWarehouse);
        validateTransferWarehouse(transportOrder, sourceWarehouse, true);
        validateTransferWarehouse(transportOrder, destinationWarehouse, false);

        String referenceNumber = dto.getReferenceNumber();
        if (referenceNumber == null || referenceNumber.isBlank()) {
            referenceNumber = transportOrder.getOrderNumber();
        }

        StockMovement saved = applyMovement(
                sourceWarehouse,
                product,
                dto.getQuantity(),
                StockMovementType.RETURN_IN,
                StockMovementReasonCode.RETURN_IN,
                dto.getReasonDescription(),
                StockMovementReferenceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                referenceNumber,
                dto.getReferenceNote(),
                null,
                null,
                transportOrder,
                false
        );

        return StockMovementMapper.toResponse(saved);
    }


    @Override
    @Transactional
    public StockMovementResponse adjustment(StockAdjustmentCreate dto) {
        StockMovement saved = applyMovement(
                getAccessibleWarehouseForUpdate(dto.getWarehouseId()),
                getAccessibleProduct(dto.getProductId()),
                dto.getQuantity(),
                StockMovementType.ADJUSTMENT,
                StockMovementReasonCode.INVENTORY_ADJUSTMENT,
                dto.getReasonDescription(),
                StockMovementReferenceType.MANUAL,
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                dto.getDirection(),
                null,
                dto.getDirection() == StockAdjustmentDirection.DECREASE
        );
        return StockMovementMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockMovementResponse writeOff(StockWriteOffCreate dto) {
        StockMovement saved = applyMovement(
                getAccessibleWarehouseForUpdate(dto.getWarehouseId()),
                getAccessibleProduct(dto.getProductId()),
                dto.getQuantity(),
                StockMovementType.WRITE_OFF,
                StockMovementReasonCode.DAMAGE_WRITE_OFF,
                dto.getReasonDescription(),
                resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                null,
                false
        );
        return StockMovementMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockMovementResponse returnStock(StockReturnCreate dto) {
        StockMovement referencedMovement = dto.getReferenceId() != null ? getAccessibleStockMovement(dto.getReferenceId()) : null;
        StockMovementType movementType = resolveReturnMovementType(referencedMovement);
        validateReturnReference(dto, referencedMovement);
        StockMovementReasonCode reasonCode = movementType == StockMovementType.RETURN_OUT
                ? StockMovementReasonCode.RETURN_OUT
                : StockMovementReasonCode.RETURN_IN;

        StockMovement saved = applyMovement(
                getAccessibleWarehouseForUpdate(dto.getWarehouseId()),
                getAccessibleProduct(dto.getProductId()),
                dto.getQuantity(),
                movementType,
                reasonCode,
                dto.getReasonDescription(),
                resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                null,
                false
        );
        return StockMovementMapper.toResponse(saved);
    }


    private void validateTransportTransferRequest(StockTransferCreate dto) {
        if (dto == null) {
            throw new BadRequestException("Transport transfer request is required");
        }
        if (dto.getTransportOrderId() == null) {
            throw new BadRequestException("Transport order id is required for transport inventory flow");
        }
        if (dto.getSourceWarehouseId() == null || dto.getDestinationWarehouseId() == null) {
            throw new BadRequestException("Source and destination warehouses are required");
        }
        if (dto.getSourceWarehouseId().equals(dto.getDestinationWarehouseId())) {
            throw new BadRequestException("Source and destination warehouse must be different");
        }
        if (dto.getProductId() == null) {
            throw new BadRequestException("Product is required");
        }
        positiveQuantity(dto.getQuantity(), "Movement quantity must be greater than zero");
    }

    private String transportTransferGroupId(TransportOrder transportOrder) {
        return "TRF-ORDER-" + transportOrder.getId();
    }

    private void validateReturnReference(StockReturnCreate dto, StockMovement referencedMovement) {
        if (referencedMovement == null) {
            return;
        }

        if (referencedMovement.getProduct() == null || !referencedMovement.getProduct().getId().equals(dto.getProductId())) {
            throw new BadRequestException("Return reference must use the same product");
        }
    }

    private StockMovementType resolveReturnMovementType(StockMovement referencedMovement) {
        if (referencedMovement == null) {
            return StockMovementType.RETURN_IN;
        }

        return switch (referencedMovement.getMovementType()) {
            case INBOUND, TRANSFER_IN, RETURN_IN -> StockMovementType.RETURN_OUT;
            case OUTBOUND, TRANSFER_OUT, WRITE_OFF, RETURN_OUT -> StockMovementType.RETURN_IN;
            case ADJUSTMENT -> throw new BadRequestException("Return cannot be based on adjustment movement");
        };
    }

    private StockMovementReferenceType resolveManualOrStockMovementReferenceType(Long referenceId) {
        return referenceId != null
                ? StockMovementReferenceType.STOCK_MOVEMENT
                : StockMovementReferenceType.MANUAL;
    }

    private StockMovement applyMovement(
            Warehouse warehouse,
            Product product,
            BigDecimal quantity,
            StockMovementType movementType,
            StockMovementReasonCode reasonCode,
            String reasonDescription,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String referenceNumber,
            String referenceNote,
            String transferGroupId,
            StockAdjustmentDirection adjustmentDirection,
            TransportOrder transportOrder,
            boolean decreaseForAdjustmentOrReservedTransfer
    ) {
        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouseIdAndProductIdForUpdate(warehouse.getId(), product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        User currentUser = authenticatedUserProvider.getAuthenticatedUser();
        BigDecimal movementQuantity = positiveQuantity(quantity, "Movement quantity must be greater than zero");
        validateMovementContext(movementType, reasonCode, referenceType, referenceId, transferGroupId, adjustmentDirection, transportOrder);
        validateMovementReason(movementType, reasonCode, adjustmentDirection);

        BigDecimal quantityBefore = inventory.getSafeQuantity();
        BigDecimal reservedBefore = inventory.getSafeReservedQuantity();
        BigDecimal availableBefore = inventory.getAvailableQuantity();
        BigDecimal projectedQuantityAfter = projectQuantityAfter(
                inventory,
                movementType,
                movementQuantity,
                decreaseForAdjustmentOrReservedTransfer
        );

        validateWarehouseCapacity(warehouse, quantityBefore, projectedQuantityAfter);
        applyInventoryMovement(
                inventory,
                movementType,
                movementQuantity,
                decreaseForAdjustmentOrReservedTransfer,
                transportOrder
        );

        BigDecimal quantityAfter = inventory.getSafeQuantity();
        BigDecimal reservedAfter = inventory.getSafeReservedQuantity();
        BigDecimal availableAfter = inventory.getAvailableQuantity();
        validateInventoryState(quantityAfter, reservedAfter);

        WarehouseInventory savedInventory = warehouseInventoryRepository.save(inventory);

        recordInventoryQuantityHistory(savedInventory, quantityBefore, quantityAfter, reservedBefore, reservedAfter);

        StockMovement stockMovement = new StockMovement(
                movementType,
                movementQuantity,
                reasonCode,
                reasonDescription,
                referenceType,
                referenceId,
                referenceNumber,
                referenceNote,
                transferGroupId,
                adjustmentDirection,
                quantityBefore,
                quantityAfter,
                reservedBefore,
                reservedAfter,
                availableBefore,
                availableAfter,
                warehouse,
                product,
                currentUser,
                transportOrder
        );

        StockMovement saved = stockMovementRepository.save(stockMovement);
        recordStockMovementAudit(saved, warehouse, product, transportOrder);
        createOperationalTaskForStockMovement(saved);
        return saved;
    }

    private BigDecimal projectQuantityAfter(
            WarehouseInventory inventory,
            StockMovementType movementType,
            BigDecimal movementQuantity,
            boolean decreaseForAdjustmentOrReservedTransfer
    ) {
        BigDecimal quantityBefore = inventory.getSafeQuantity();

        return switch (movementType) {
            case INBOUND, TRANSFER_IN, RETURN_IN -> quantityBefore.add(movementQuantity);
            case OUTBOUND, TRANSFER_OUT, WRITE_OFF, RETURN_OUT -> quantityBefore.subtract(movementQuantity);
            case ADJUSTMENT -> decreaseForAdjustmentOrReservedTransfer
                    ? quantityBefore.subtract(movementQuantity)
                    : quantityBefore.add(movementQuantity);
        };
    }

    private void applyInventoryMovement(
            WarehouseInventory inventory,
            StockMovementType movementType,
            BigDecimal movementQuantity,
            boolean decreaseForAdjustmentOrReservedTransfer,
            TransportOrder transportOrder
    ) {
        try {
            switch (movementType) {
                case INBOUND, TRANSFER_IN, RETURN_IN -> inventory.increase(movementQuantity);
                case OUTBOUND, WRITE_OFF, RETURN_OUT -> inventory.decrease(movementQuantity);
                case TRANSFER_OUT -> {
                    if (transportOrder != null && decreaseForAdjustmentOrReservedTransfer) {
                        inventory.moveOutReserved(movementQuantity);
                    } else {
                        inventory.decrease(movementQuantity);
                    }
                }
                case ADJUSTMENT -> {
                    if (decreaseForAdjustmentOrReservedTransfer) {
                        inventory.decrease(movementQuantity);
                    } else {
                        inventory.increase(movementQuantity);
                    }
                }
            }
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new BadRequestException(ex.getMessage());
        }
    }

    private void recordStockMovementAudit(StockMovement saved, Warehouse warehouse, Product product, TransportOrder transportOrder) {
        auditFacade.recordCreate("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved));
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "movementType", null, saved.getMovementType());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "quantity", null, saved.getQuantity());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "warehouseId", null, warehouse.getId());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "productId", null, product.getId());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "transportOrderId", null, transportOrder != null ? transportOrder.getId() : null);
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "referenceType", null, saved.getReferenceType());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "referenceId", null, saved.getReferenceId());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "transferGroupId", null, saved.getTransferGroupId());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "adjustmentDirection", null, saved.getAdjustmentDirection());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "quantityBefore", null, saved.getQuantityBefore());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "quantityAfter", null, saved.getQuantityAfter());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "reservedBefore", null, saved.getReservedBefore());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "reservedAfter", null, saved.getReservedAfter());
        auditFacade.log(
                "CREATE",
                "STOCK_MOVEMENT",
                saved.getId(),
                "Stock movement created (ID: " + saved.getId()
                        + ", warehouseId=" + warehouse.getId()
                        + ", productId=" + product.getId() + ")"
        );
    }

    private void validateMovementContext(
            StockMovementType movementType,
            StockMovementReasonCode reasonCode,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String transferGroupId,
            StockAdjustmentDirection adjustmentDirection,
            TransportOrder transportOrder
    ) {
        if (movementType == null || reasonCode == null || referenceType == null) {
            throw new BadRequestException("Movement type, reason code and reference type are required");
        }

        if (movementType == StockMovementType.ADJUSTMENT && adjustmentDirection == null) {
            throw new BadRequestException("Adjustment direction is required for adjustment movement");
        }

        if (movementType != StockMovementType.ADJUSTMENT && adjustmentDirection != null) {
            throw new BadRequestException("Adjustment direction is allowed only for adjustment movement");
        }

        if ((movementType == StockMovementType.TRANSFER_IN || movementType == StockMovementType.TRANSFER_OUT)
                && (transferGroupId == null || transferGroupId.isBlank())) {
            throw new BadRequestException("Transfer group id is required for transfer movement");
        }

        if (movementType != StockMovementType.TRANSFER_IN
                && movementType != StockMovementType.TRANSFER_OUT
                && transferGroupId != null
                && !transferGroupId.isBlank()) {
            throw new BadRequestException("Transfer group id is allowed only for transfer movements");
        }

        if (referenceType == StockMovementReferenceType.TRANSPORT_ORDER) {
            if (transportOrder == null || referenceId == null || !referenceId.equals(transportOrder.getId())) {
                throw new BadRequestException("Transport order reference must match the linked transport order");
            }
            return;
        }

        if (transportOrder != null) {
            throw new BadRequestException("Transport order can be linked only with TRANSPORT_ORDER reference type");
        }

        if (referenceType == StockMovementReferenceType.STOCK_MOVEMENT) {
            if (referenceId == null) {
                throw new BadRequestException("Stock movement reference id is required");
            }
            getAccessibleStockMovement(referenceId);
        }
    }

    private void validateMovementReason(
            StockMovementType movementType,
            StockMovementReasonCode reasonCode,
            StockAdjustmentDirection adjustmentDirection
    ) {
        boolean valid = switch (movementType) {
            case INBOUND -> reasonCode == StockMovementReasonCode.MANUAL_INBOUND
                    || reasonCode == StockMovementReasonCode.PURCHASE_RECEIPT
                    || reasonCode == StockMovementReasonCode.INITIAL_STOCK
                    || reasonCode == StockMovementReasonCode.TRANSPORT_RECEIPT;
            case OUTBOUND -> reasonCode == StockMovementReasonCode.MANUAL_OUTBOUND
                    || reasonCode == StockMovementReasonCode.TRANSPORT_DISPATCH;
            case WRITE_OFF -> reasonCode == StockMovementReasonCode.DAMAGE_WRITE_OFF;
            case RETURN_IN -> reasonCode == StockMovementReasonCode.RETURN_IN;
            case RETURN_OUT -> reasonCode == StockMovementReasonCode.RETURN_OUT;
            case TRANSFER_OUT -> reasonCode == StockMovementReasonCode.MANUAL_OUTBOUND
                    || reasonCode == StockMovementReasonCode.TRANSPORT_DISPATCH;
            case TRANSFER_IN -> reasonCode == StockMovementReasonCode.MANUAL_INBOUND
                    || reasonCode == StockMovementReasonCode.TRANSPORT_RECEIPT;
            case ADJUSTMENT -> reasonCode == StockMovementReasonCode.INVENTORY_ADJUSTMENT
                    || reasonCode == StockMovementReasonCode.CORRECTION;
        };

        if (!valid) {
            throw new BadRequestException("Reason code is not valid for selected stock movement type");
        }

        if (movementType == StockMovementType.ADJUSTMENT && adjustmentDirection == null) {
            throw new BadRequestException("Adjustment direction is required for adjustment movement");
        }
    }

    private void validateInventoryState(BigDecimal quantityAfter, BigDecimal reservedAfter) {
        if (quantityAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Quantity after movement cannot be negative");
        }
        if (reservedAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Reserved quantity after movement cannot be negative");
        }
        if (quantityAfter.subtract(reservedAfter).compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Available quantity after movement cannot be negative");
        }
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
                    + ", requested quantity after movement: "
                    + projectedWarehouseQuantity
                    + ", capacity: "
                    + warehouse.getCapacity());
        }
    }

    private BigDecimal positiveQuantity(BigDecimal value, String message) {
        BigDecimal normalized = QueryParameterNormalizer.zeroIfNull(value);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(message);
        }
        return normalized;
    }

    @Override
    @Transactional(readOnly = true)
    public StockMovementResponse getById(Long id) {
        return StockMovementMapper.toResponse(getAccessibleStockMovement(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> getAll(Pageable pageable) {
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        return PageResponse.from(stockMovementRepository.searchMovements(
                companyId,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                pageable
        ).map(StockMovementMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> search(
            String search,
            StockMovementType movementType,
            Long warehouseId,
            Long productId,
            Long transportOrderId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    ) {
        String normalizedSearch = QueryParameterNormalizer.trimToNull(search);
        Long searchId = QueryParameterNormalizer.parseLongOrNull(normalizedSearch);
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        if (warehouseId != null) {
            getAccessibleWarehouse(warehouseId);
        }

        if (productId != null) {
            getAccessibleProduct(productId);
        }

        if (transportOrderId != null) {
            TransportOrder transportOrder = authenticatedUserProvider.isOverlord()
                    ? transportOrderRepository.findById(transportOrderId)
                        .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"))
                    : transportOrderRepository.findByIdAndCreatedBy_Company_Id(
                        transportOrderId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                    ).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

            if (warehouseId != null) {
                validateTransportOrderContext(transportOrder, getAccessibleWarehouse(warehouseId));
            }
        }

        return PageResponse.from(stockMovementRepository
                .searchMovements(
                        companyId,
                        normalizedSearch,
                        searchId,
                        movementType,
                        warehouseId,
                        productId,
                        transportOrderId,
                        fromDate,
                        toDate,

                        pageable
                )
                .map(StockMovementMapper::toResponse));
    }

    private void recordInventoryQuantityHistory(
            WarehouseInventory inventory,
            BigDecimal quantityBefore,
            BigDecimal quantityAfter,
            BigDecimal reservedBefore,
            BigDecimal reservedAfter
    ) {
        String identifier = inventoryIdentifier(inventory);
        Long entityId = inventory.getWarehouse().getId();

        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", entityId, identifier, "quantity", quantityBefore, quantityAfter);
        auditFacade.recordFieldChange("WAREHOUSE_INVENTORY", entityId, identifier, "reservedQuantity", reservedBefore, reservedAfter);
        auditFacade.recordFieldChange(
                "WAREHOUSE_INVENTORY",
                entityId,
                identifier,
                "availableQuantity",
                quantityBefore.subtract(reservedBefore),
                quantityAfter.subtract(reservedAfter)
        );
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

    private void createOperationalTaskForStockMovement(StockMovement stockMovement) {
        if (!shouldCreateOperationalTask(stockMovement)) {
            return;
        }

        Employee assignee = resolveTaskAssignee(stockMovement);
        if (assignee == null) {
            return;
        }

        String reference = stockMovement.getReferenceNumber() != null && !stockMovement.getReferenceNumber().isBlank()
                ? stockMovement.getReferenceNumber()
                : "#" + stockMovement.getId();

        taskService.create(new TaskCreate(
                "Stock movement " + reference,
                "Operational task generated automatically for stock movement " + reference + ".",
                timeService.nowForWarehouse(stockMovement.getWarehouse()).plusHours(1),
                TaskPriority.MEDIUM,
                assignee.getId(),
                stockMovement.getTransportOrder() != null ? stockMovement.getTransportOrder().getId() : null,
                stockMovement.getId()
        ));
    }

    private boolean shouldCreateOperationalTask(StockMovement stockMovement) {
        if (stockMovement.getTransportOrder() == null
                || stockMovement.getReferenceType() != StockMovementReferenceType.TRANSPORT_ORDER) {
            return false;
        }

        StockMovementReasonCode reasonCode = stockMovement.getReasonCode();
        StockMovementType movementType = stockMovement.getMovementType();

        return (movementType == StockMovementType.OUTBOUND
                    || movementType == StockMovementType.INBOUND
                    || movementType == StockMovementType.TRANSFER_OUT
                    || movementType == StockMovementType.TRANSFER_IN)
                && (reasonCode == StockMovementReasonCode.TRANSPORT_DISPATCH
                    || reasonCode == StockMovementReasonCode.TRANSPORT_RECEIPT);
    }

    private Employee resolveTaskAssignee(StockMovement stockMovement) {
        if (stockMovement.getTransportOrder() != null && stockMovement.getTransportOrder().getAssignedEmployee() != null) {
            return stockMovement.getTransportOrder().getAssignedEmployee();
        }

        if (stockMovement.getWarehouse() != null && stockMovement.getWarehouse().getManager() != null) {
            return stockMovement.getWarehouse().getManager();
        }

        return null;
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

    private Warehouse getAccessibleWarehouseForUpdate(Long warehouseId) {
        if (authenticatedUserProvider.isOverlord()) {
            return warehouseRepository.findByIdForUpdate(warehouseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        }

        return warehouseRepository.findByIdAndCompanyIdForUpdate(
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

    private StockMovement getAccessibleStockMovement(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return stockMovementRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found"));
        }

        return stockMovementRepository.findByIdAndWarehouse_Company_Id(
                        id,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found"));
    }

    private TransportOrder resolveTransportOrder(Long transportOrderId, Warehouse warehouse) {
        if (transportOrderId == null) {
            return null;
        }

        TransportOrder transportOrder = authenticatedUserProvider.isOverlord()
                ? transportOrderRepository.findById(transportOrderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"))
                : transportOrderRepository.findByIdAndCreatedBy_Company_Id(
                    transportOrderId,
                    authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                ).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        validateTransportOrderContext(transportOrder, warehouse);
        return transportOrder;
    }

    private void validateTransferWarehouse(TransportOrder transportOrder, Warehouse warehouse, boolean sourceWarehouseExpected) {
        Long expectedWarehouseId = sourceWarehouseExpected
                ? transportOrder.getSourceWarehouse() != null ? transportOrder.getSourceWarehouse().getId() : null
                : transportOrder.getDestinationWarehouse() != null ? transportOrder.getDestinationWarehouse().getId() : null;

        if (expectedWarehouseId == null || warehouse == null || !expectedWarehouseId.equals(warehouse.getId())) {
            throw new BadRequestException(sourceWarehouseExpected
                    ? "TRANSFER_OUT warehouse must match transport order source warehouse"
                    : "TRANSFER_IN warehouse must match transport order destination warehouse");
        }
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

    private void validateTransportOrderContext(TransportOrder transportOrder, Warehouse warehouse) {
        if (transportOrder == null) {
            return;
        }

        Long orderCompanyId = transportOrder.getCreatedBy() != null
                && transportOrder.getCreatedBy().getCompany() != null
                ? transportOrder.getCreatedBy().getCompany().getId()
                : null;
        Long warehouseCompanyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;

        authenticatedUserProvider.ensureSameCompany(
                orderCompanyId,
                warehouseCompanyId,
                "Transport order and warehouse must belong to the same company"
        );
    }

}
