package rs.logistics.logistics_system.service.implementation;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;
import rs.logistics.logistics_system.service.support.BinIntegrityValidator;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.response.StockMovementTraceResponse;
import rs.logistics.logistics_system.entity.BinInventory;
import rs.logistics.logistics_system.entity.BinLocation;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementDiscrepancyReason;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionEngine;
import rs.logistics.logistics_system.mapper.StockMovementMapper;
import rs.logistics.logistics_system.repository.BinInventoryRepository;
import rs.logistics.logistics_system.repository.BinLocationRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.InventoryCountSessionRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockMovementService implements StockMovementServiceDefinition {

    private final StockMovementRepository stockMovementRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final BinInventoryRepository binInventoryRepository;
    private final BinLocationRepository binLocationRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditFacadeDefinition auditFacade;
    private final DomainEventServiceDefinition domainEventService;
    private final TaskServiceDefinition taskService;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AppProperties appProperties;
    private final TimeServiceDefinition timeService;
    private final BinIntegrityValidator binIntegrityValidator;
    private final LifecycleNotificationService lifecycleNotificationService;
    private final LifecycleTransitionEngine lifecycleTransitionEngine;
    private final WarehouseAccessGuard warehouseAccessGuard;
    private final InventoryCountSessionRepository inventoryCountSessionRepository;


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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                dto.getTransportOrderId() != null
                        ? StockMovementReferenceType.TRANSPORT_ORDER
                        : resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getTransportOrderId() != null ? dto.getTransportOrderId() : dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                transportOrder,
                dto.getBinLocationId(),
                false
        );
        return toResponseWithLifecycle(saved);
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                dto.getTransportOrderId() != null
                        ? StockMovementReferenceType.TRANSPORT_ORDER
                        : resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getTransportOrderId() != null ? dto.getTransportOrderId() : dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                transportOrder,
                dto.getBinLocationId(),
                false
        );
        return toResponseWithLifecycle(saved);
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                referenceType,
                referenceId,
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                dto.getSourceBinLocationId(),
                true
        );

        StockMovement in = applyMovement(
                destinationWarehouse,
                product,
                dto.getQuantity(),
                StockMovementType.TRANSFER_IN,
                dto.getTransportOrderId() != null ? StockMovementReasonCode.TRANSPORT_RECEIPT : StockMovementReasonCode.MANUAL_INBOUND,
                dto.getReasonDescription(),
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                referenceType,
                referenceId,
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                dto.getDestinationBinLocationId(),
                false
        );

        return List.of(toResponseWithLifecycle(out), toResponseWithLifecycle(in));
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                StockMovementReferenceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                dto.getSourceBinLocationId(),
                true
        );

        return executeCreatedMovement(saved);
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                StockMovementReferenceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                referenceNumber,
                dto.getReferenceNote(),
                transferGroupId,
                null,
                transportOrder,
                dto.getDestinationBinLocationId(),
                false
        );

        return executeCreatedMovement(saved);
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                StockMovementReferenceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                referenceNumber,
                dto.getReferenceNote(),
                null,
                null,
                transportOrder,
                dto.getSourceBinLocationId(),
                false
        );

        return executeCreatedMovement(saved);
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                dto.getReferenceType() != null ? dto.getReferenceType() : StockMovementReferenceType.MANUAL,
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                dto.getDirection(),
                null,
                dto.getBinLocationId(),
                dto.getDirection() == StockAdjustmentDirection.DECREASE
        );
        if (requiresAdjustmentApproval(saved)) {
            saved = submitMovementForApproval(saved, "Adjustment quantity requires approval");
        }
        return toResponseWithLifecycle(saved);
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                null,
                dto.getBinLocationId(),
                false
        );
        saved = submitMovementForApproval(saved, "Write-off requires approval");
        return toResponseWithLifecycle(saved);
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
                dto.getExpectedQuantity(),
                dto.getActualQuantity(),
                dto.getDiscrepancyReason(),
                dto.getDiscrepancyNote(),
                dto.getBatchLotNumber(),
                dto.getBatchExpirationDate(),
                dto.getSerialNumbers(),
                dto.getUnitCost(),
                dto.getTotalCost(),
                dto.getCurrency(),
                resolveManualOrStockMovementReferenceType(dto.getReferenceId()),
                dto.getReferenceId(),
                dto.getReferenceNumber(),
                dto.getReferenceNote(),
                null,
                null,
                null,
                dto.getBinLocationId(),
                false
        );
        return toResponseWithLifecycle(saved);
    }

    private BigDecimal normalizeCost(BigDecimal value) {
        return value != null ? value : null;
    }

    private BigDecimal normalizeTotalCost(BigDecimal totalCost, BigDecimal unitCost, BigDecimal quantity) {
        if (totalCost != null) {
            return totalCost;
        }
        if (unitCost == null || quantity == null) {
            return null;
        }
        return unitCost.multiply(quantity);
    }

    private String normalizeCurrency(String currency) {
        return currency == null || currency.isBlank() ? null : currency.trim().toUpperCase();
    }

    private String normalizeBatchLotNumber(String batchLotNumber) {
        if (batchLotNumber == null || batchLotNumber.isBlank()) {
            return null;
        }
        return batchLotNumber.trim();
    }

    private String serializeSerialNumbers(List<String> serialNumbers) {
        if (serialNumbers == null || serialNumbers.isEmpty()) {
            return null;
        }
        String serialized = serialNumbers.stream()
                .filter(serial -> serial != null && !serial.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.joining(","));
        return serialized.isBlank() ? null : serialized;
    }

    private List<String> parseSerialNumbers(String serialNumbers) {
        if (serialNumbers == null || serialNumbers.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(serialNumbers.split(","))
                .map(String::trim)
                .filter(serial -> !serial.isBlank())
                .toList();
    }

    private void validateBatchSerialTracking(StockMovement movement) {
        if (movement.getBatchExpirationDate() != null && movement.getBatchLotNumber() == null) {
            throw new BadRequestException("Batch expiration date requires batch/lot number");
        }
        if (movement.getSerialNumbers() != null) {
            int serialCount = parseSerialNumbers(movement.getSerialNumbers()).size();
            if (serialCount == 0) {
                movement.setSerialNumbers(null);
                return;
            }
            if (movement.getQuantity() != null && movement.getQuantity().stripTrailingZeros().scale() <= 0 && movement.getQuantity().intValue() != serialCount) {
                throw new BadRequestException("Serial number count must match movement quantity for serialized stock");
            }
        }
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
            case ADJUSTMENT, RESERVATION, RESERVATION_RELEASE -> throw new BadRequestException("Return cannot be based on adjustment or reservation movement");
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
            BigDecimal expectedQuantity,
            BigDecimal actualQuantity,
            StockMovementDiscrepancyReason discrepancyReason,
            String discrepancyNote,
            String batchLotNumber,
            LocalDate batchExpirationDate,
            List<String> serialNumbers,
            BigDecimal unitCost,
            BigDecimal totalCost,
            String currency,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String referenceNumber,
            String referenceNote,
            String transferGroupId,
            StockAdjustmentDirection adjustmentDirection,
            TransportOrder transportOrder,
            Long binLocationId,
            boolean decreaseForAdjustmentOrReservedTransfer
    ) {
        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouseIdAndProductIdForUpdate(warehouse.getId(), product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        User currentUser = authenticatedUserProvider.getAuthenticatedUser();
        BigDecimal movementQuantity = movementType == StockMovementType.ADJUSTMENT
                ? positiveQuantity(quantity, "Adjustment quantity must be greater than zero")
                : positiveQuantity(actualQuantity != null ? actualQuantity : quantity, "Actual movement quantity must be greater than zero");
        BigDecimal normalizedExpectedQuantity = movementType == StockMovementType.ADJUSTMENT
                ? QueryParameterNormalizer.zeroIfNull(expectedQuantity)
                : positiveQuantity(expectedQuantity != null ? expectedQuantity : movementQuantity, "Expected movement quantity must be greater than zero");
        BigDecimal normalizedActualQuantity = movementType == StockMovementType.ADJUSTMENT
                ? QueryParameterNormalizer.zeroIfNull(actualQuantity)
                : movementQuantity;
        BigDecimal discrepancyQuantity = normalizedActualQuantity.subtract(normalizedExpectedQuantity);
        validateDiscrepancy(discrepancyQuantity, discrepancyReason, discrepancyNote, transportOrder, referenceType);
        validateMovementContext(movementType, reasonCode, referenceType, referenceId, transferGroupId, adjustmentDirection, transportOrder);
        validateMovementReason(movementType, reasonCode, adjustmentDirection);
        binIntegrityValidator.ensureBinSelectionMatchesWarehouseMode(warehouse, binLocationId);
        ensureStockMovementAllowedDuringInventoryCount(warehouse, product, binLocationId, movementType, referenceType);

        BigDecimal quantityBefore = inventory.getSafeQuantity();
        BigDecimal reservedBefore = inventory.getSafeReservedQuantity();
        BigDecimal availableBefore = inventory.getAvailableQuantity();

        StockMovement parentMovement = resolveParentMovement(referenceType, referenceId, transportOrder, transferGroupId, product);
        Long parentMovementId = parentMovement != null ? parentMovement.getId() : null;
        Long rootMovementId = resolveRootMovementId(parentMovement);
        String sourceType = resolveSourceType(referenceType, transportOrder, parentMovement);
        Long sourceId = resolveSourceId(referenceType, referenceId, transportOrder, parentMovement);
        String lifecycleReferenceCode = resolveReferenceCode(referenceNumber, transportOrder, transferGroupId, parentMovement);

        StockMovement stockMovement = new StockMovement(
                movementType,
                movementQuantity,
                reasonCode,
                reasonDescription,
                normalizedExpectedQuantity,
                normalizedActualQuantity,
                discrepancyQuantity,
                discrepancyReason,
                discrepancyNote,
                normalizeCost(unitCost),
                normalizeTotalCost(totalCost, unitCost, normalizedActualQuantity),
                normalizeCurrency(currency),
                referenceType,
                referenceId,
                referenceNumber,
                referenceNote,
                transferGroupId,
                adjustmentDirection,
                quantityBefore,
                quantityBefore,
                reservedBefore,
                reservedBefore,
                availableBefore,
                availableBefore,
                warehouse,
                product,
                currentUser,
                transportOrder
        );
        stockMovement.setStatus(StockMovementStatus.DRAFT);
        stockMovement.setParentMovementId(parentMovementId);
        stockMovement.setRootMovementId(rootMovementId);
        stockMovement.setSourceType(sourceType);
        stockMovement.setSourceId(sourceId);
        stockMovement.setReferenceCode(lifecycleReferenceCode);
        stockMovement.setBatchLotNumber(normalizeBatchLotNumber(batchLotNumber));
        stockMovement.setBatchExpirationDate(batchExpirationDate);
        stockMovement.setSerialNumbers(serializeSerialNumbers(serialNumbers));
        validateBatchSerialTracking(stockMovement);

        BinLocation movementBin = resolveMovementBinForDraft(warehouse, binLocationId);
        if (movementBin != null) {
            if (shouldDecreaseBin(movementType, adjustmentDirection, decreaseForAdjustmentOrReservedTransfer)) {
                stockMovement.setSourceBin(movementBin);
            }
            if (shouldIncreaseBin(movementType, adjustmentDirection, decreaseForAdjustmentOrReservedTransfer)) {
                stockMovement.setDestinationBin(movementBin);
            }
        }

        StockMovement saved = stockMovementRepository.saveAndFlush(stockMovement);
        recordStockMovementAudit(saved, warehouse, product, transportOrder);
        lifecycleNotificationService.notifyStockMovementCreated(saved);
        return saved;
    }

    private void ensureStockMovementAllowedDuringInventoryCount(
            Warehouse warehouse,
            Product product,
            Long binLocationId,
            StockMovementType movementType,
            StockMovementReferenceType referenceType
    ) {
        if (isInventoryCountAdjustment(movementType, referenceType)) {
            return;
        }

        List<InventoryCountSessionStatus> blockingStatuses = List.of(
                InventoryCountSessionStatus.OPEN,
                InventoryCountSessionStatus.COUNTING,
                InventoryCountSessionStatus.REVIEW,
                InventoryCountSessionStatus.APPROVED
        );

        boolean blocked = binLocationId != null
                ? inventoryCountSessionRepository.existsBlockingStockChangeForBinProduct(
                        warehouse.getId(),
                        product.getId(),
                        binLocationId,
                        blockingStatuses
                )
                : inventoryCountSessionRepository.existsBlockingStockChangeForWarehouseProduct(
                        warehouse.getId(),
                        product.getId(),
                        blockingStatuses
                );

        if (blocked) {
            throw new BadRequestException("Stock movement is blocked because an inventory count is active for this warehouse/product/location");
        }
    }

    private boolean isInventoryCountAdjustment(StockMovementType movementType, StockMovementReferenceType referenceType) {
        return movementType == StockMovementType.ADJUSTMENT
                && referenceType == StockMovementReferenceType.INVENTORY_COUNT;
    }

    private BinLocation resolveMovementBinForDraft(Warehouse warehouse, Long binLocationId) {
        if (binLocationId == null) {
            return null;
        }
        BinLocation bin = getAccessibleBinLocation(binLocationId);
        binIntegrityValidator.ensureBinBelongsToWarehouse(bin, warehouse, "Selected bin must belong to selected warehouse");
        binIntegrityValidator.ensureActiveBin(bin, "Selected bin is not active");
        return bin;
    }

    private BinLocation applyOptionalBinMovement(
            Warehouse warehouse,
            Product product,
            Long binLocationId,
            StockMovementType movementType,
            BigDecimal movementQuantity,
            StockAdjustmentDirection adjustmentDirection,
            WarehouseInventory warehouseInventory,
            boolean decreaseForAdjustmentOrReservedTransfer
    ) {
        if (binLocationId == null) {
            return null;
        }

        BinLocation bin = getAccessibleBinLocation(binLocationId);
        binIntegrityValidator.ensureBinBelongsToWarehouse(bin, warehouse, "Selected bin must belong to selected warehouse");
        binIntegrityValidator.ensureActiveBin(bin, "Selected bin is not active");

        boolean increaseBin = shouldIncreaseBin(movementType, adjustmentDirection, decreaseForAdjustmentOrReservedTransfer);
        boolean decreaseBin = shouldDecreaseBin(movementType, adjustmentDirection, decreaseForAdjustmentOrReservedTransfer);

        if (!increaseBin && !decreaseBin) {
            return null;
        }

        BinInventory binInventory = increaseBin
                ? binIntegrityValidator.lockOrCreateBinInventory(bin, product)
                : binIntegrityValidator.lockRequiredBinInventory(bin, product, "Bin inventory not found for selected product");

        BigDecimal before = binInventory.getSafeQuantity();
        try {
            if (increaseBin) {
                binInventory.increase(movementQuantity);
            } else {
                binInventory.decrease(movementQuantity);
            }
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new BadRequestException(ex.getMessage());
        }

        BigDecimal after = binInventory.getSafeQuantity();
        binIntegrityValidator.ensureBinInventoryDoesNotExceedWarehouseInventory(bin, product, after, warehouseInventory);
        BinInventory savedBinInventory = binInventoryRepository.saveAndFlush(binInventory);
        recordBinInventoryQuantityHistory(savedBinInventory, before, after);
        return bin;
    }

    private boolean shouldIncreaseBin(
            StockMovementType movementType,
            StockAdjustmentDirection adjustmentDirection,
            boolean decreaseForAdjustmentOrReservedTransfer
    ) {
        return switch (movementType) {
            case INBOUND, TRANSFER_IN, RETURN_IN -> true;
            case ADJUSTMENT -> adjustmentDirection == StockAdjustmentDirection.INCREASE && !decreaseForAdjustmentOrReservedTransfer;
            default -> false;
        };
    }

    private boolean shouldDecreaseBin(
            StockMovementType movementType,
            StockAdjustmentDirection adjustmentDirection,
            boolean decreaseForAdjustmentOrReservedTransfer
    ) {
        return switch (movementType) {
            case OUTBOUND, TRANSFER_OUT, WRITE_OFF, RETURN_OUT -> true;
            case ADJUSTMENT -> adjustmentDirection == StockAdjustmentDirection.DECREASE || decreaseForAdjustmentOrReservedTransfer;
            default -> false;
        };
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
            case RESERVATION, RESERVATION_RELEASE -> quantityBefore;
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
                case RESERVATION -> inventory.reserve(movementQuantity);
                case RESERVATION_RELEASE -> inventory.release(movementQuantity);
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
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "expectedQuantity", null, saved.getExpectedQuantity());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "actualQuantity", null, saved.getActualQuantity());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "discrepancyQuantity", null, saved.getDiscrepancyQuantity());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "discrepancyReason", null, saved.getDiscrepancyReason());
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

    private void validateDiscrepancy(
            BigDecimal discrepancyQuantity,
            StockMovementDiscrepancyReason discrepancyReason,
            String discrepancyNote,
            TransportOrder transportOrder,
            StockMovementReferenceType referenceType
    ) {
        boolean hasDiscrepancy = discrepancyQuantity != null && discrepancyQuantity.compareTo(BigDecimal.ZERO) != 0;
        if (!hasDiscrepancy) {
            return;
        }
        if (discrepancyReason == null) {
            throw new BadRequestException("Discrepancy reason is required when actual quantity differs from expected quantity");
        }
        if ((discrepancyReason == StockMovementDiscrepancyReason.DAMAGE
                || discrepancyReason == StockMovementDiscrepancyReason.SHORTAGE
                || discrepancyReason == StockMovementDiscrepancyReason.TRANSPORT_LOSS)
                && (discrepancyNote == null || discrepancyNote.isBlank())) {
            throw new BadRequestException("Discrepancy note is required for shortage, damage or transport loss");
        }
        if (discrepancyReason == StockMovementDiscrepancyReason.TRANSPORT_LOSS
                && transportOrder == null
                && referenceType != StockMovementReferenceType.TRANSPORT_ORDER) {
            throw new BadRequestException("Transport loss discrepancy must be linked to a transport order");
        }
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

        if ((movementType == StockMovementType.RESERVATION || movementType == StockMovementType.RESERVATION_RELEASE)
                && referenceType != StockMovementReferenceType.TRANSPORT_ORDER
                && referenceType != StockMovementReferenceType.SYSTEM
                && referenceType != StockMovementReferenceType.MANUAL) {
            throw new BadRequestException("Reservation movements must use manual, system or transport reference");
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

    private StockMovement resolveParentMovement(
            StockMovementReferenceType referenceType,
            Long referenceId,
            TransportOrder transportOrder,
            String transferGroupId,
            Product product
    ) {
        if (referenceType == StockMovementReferenceType.STOCK_MOVEMENT && referenceId != null) {
            return getAccessibleStockMovement(referenceId);
        }

        if (transportOrder != null && transferGroupId != null && !transferGroupId.isBlank()) {
            List<StockMovement> sameTransportFlow = authenticatedUserProvider.isOverlord()
                    ? stockMovementRepository.findByTransferGroupIdOrderByCreatedAtAsc(transferGroupId)
                    : stockMovementRepository.findByTransferGroupIdAndWarehouse_Company_IdOrderByCreatedAtAsc(
                            transferGroupId,
                            authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                    );

            return sameTransportFlow.stream()
                    .filter(candidate -> candidate.getProduct() != null && candidate.getProduct().getId().equals(product.getId()))
                    .reduce((first, second) -> second)
                    .orElse(null);
        }

        return null;
    }

    private Long resolveRootMovementId(StockMovement parentMovement) {
        if (parentMovement == null) {
            return null;
        }
        return parentMovement.getRootMovementId() != null ? parentMovement.getRootMovementId() : parentMovement.getId();
    }

    private String resolveSourceType(StockMovementReferenceType referenceType, TransportOrder transportOrder, StockMovement parentMovement) {
        if (transportOrder != null) {
            return "TRANSPORT_ORDER";
        }
        if (parentMovement != null) {
            return "STOCK_MOVEMENT";
        }
        return referenceType != null ? referenceType.name() : null;
    }

    private Long resolveSourceId(StockMovementReferenceType referenceType, Long referenceId, TransportOrder transportOrder, StockMovement parentMovement) {
        if (transportOrder != null) {
            return transportOrder.getId();
        }
        if (parentMovement != null) {
            return parentMovement.getId();
        }
        return referenceType == StockMovementReferenceType.MANUAL ? null : referenceId;
    }

    private String resolveReferenceCode(String referenceNumber, TransportOrder transportOrder, String transferGroupId, StockMovement parentMovement) {
        if (referenceNumber != null && !referenceNumber.isBlank()) {
            return referenceNumber;
        }
        if (transportOrder != null) {
            return transportOrder.getOrderNumber();
        }
        if (transferGroupId != null && !transferGroupId.isBlank()) {
            return transferGroupId;
        }
        if (parentMovement != null) {
            return parentMovement.getReferenceCode() != null ? parentMovement.getReferenceCode() : parentMovement.getReferenceNumber();
        }
        return null;
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
            case RESERVATION -> reasonCode == StockMovementReasonCode.STOCK_RESERVED;
            case RESERVATION_RELEASE -> reasonCode == StockMovementReasonCode.RESERVATION_RELEASED;
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
    @Transactional
    public StockMovementResponse execute(Long id) {
        StockMovement movement = getAccessibleStockMovement(id);
        enforceWarehouseScopeForCurrentRole(movement.getWarehouse(), true);

        var context = lifecycleTransitionEngine.validate(
                LifecycleEntityType.STOCK_MOVEMENT,
                movement.getId(),
                StockMovementStatus.class,
                movement.getStatus(),
                StockMovementStatus.EXECUTED,
                "Execute stock movement",
                null,
                null
        );

        executeInventoryEffects(movement);
        movement.setStatus(StockMovementStatus.EXECUTED);
        StockMovement saved = stockMovementRepository.saveAndFlush(movement);

        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "status", context.fromStatus(), context.toStatus());
        lifecycleTransitionEngine.afterTransition(context, StockMovementStatus.class);
        recordStockMovementDomainEvent(saved, saved.getWarehouse(), saved.getProduct(), executedMovementBin(saved));
        createOperationalTaskForStockMovement(saved);
        return toResponseWithLifecycle(saved);
    }


    @Override
    @Transactional
    public StockMovementResponse approve(Long id) {
        StockMovement movement = getAccessibleStockMovement(id);
        enforceWarehouseScopeForCurrentRole(movement.getWarehouse(), true);

        StockMovement saved = transitionMovementStatus(
                movement,
                StockMovementStatus.APPROVED,
                "Approve stock movement"
        );
        return toResponseWithLifecycle(saved);
    }

    @Override
    @Transactional
    public StockMovementResponse reject(Long id) {
        StockMovement movement = getAccessibleStockMovement(id);
        enforceWarehouseScopeForCurrentRole(movement.getWarehouse(), true);

        StockMovement saved = transitionMovementStatus(
                movement,
                StockMovementStatus.REJECTED,
                "Reject stock movement"
        );
        return toResponseWithLifecycle(saved);
    }

    @Override
    @Transactional
    public StockMovementResponse cancel(Long id) {
        StockMovement movement = getAccessibleStockMovement(id);
        enforceWarehouseScopeForCurrentRole(movement.getWarehouse(), true);

        var context = lifecycleTransitionEngine.validate(
                LifecycleEntityType.STOCK_MOVEMENT,
                movement.getId(),
                StockMovementStatus.class,
                movement.getStatus(),
                StockMovementStatus.CANCELLED,
                "Cancel stock movement",
                null,
                null
        );

        movement.setStatus(StockMovementStatus.CANCELLED);
        StockMovement saved = stockMovementRepository.saveAndFlush(movement);
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "status", context.fromStatus(), context.toStatus());
        lifecycleTransitionEngine.afterTransition(context, StockMovementStatus.class);
        return toResponseWithLifecycle(saved);
    }


    private boolean requiresAdjustmentApproval(StockMovement movement) {
        if (movement == null || movement.getMovementType() != StockMovementType.ADJUSTMENT) {
            return false;
        }
        BigDecimal threshold = appProperties.getStockMovement().getAdjustmentApprovalThreshold();
        return threshold != null && movement.getQuantity().abs().compareTo(threshold) >= 0;
    }

    private StockMovement submitMovementForApproval(StockMovement movement, String reason) {
        return transitionMovementStatus(movement, StockMovementStatus.PENDING_APPROVAL, reason);
    }

    private StockMovement transitionMovementStatus(StockMovement movement, StockMovementStatus nextStatus, String reason) {
        var context = lifecycleTransitionEngine.validate(
                LifecycleEntityType.STOCK_MOVEMENT,
                movement.getId(),
                StockMovementStatus.class,
                movement.getStatus(),
                nextStatus,
                reason,
                null,
                null
        );

        movement.setStatus(nextStatus);
        StockMovement saved = stockMovementRepository.saveAndFlush(movement);
        auditFacade.recordFieldChange("STOCK_MOVEMENT", saved.getId(), stockMovementIdentifier(saved), "status", context.fromStatus(), context.toStatus());
        lifecycleTransitionEngine.afterTransition(context, StockMovementStatus.class);
        return saved;
    }


    private void validateMovementCanBeReversed(StockMovement movement) {
        if (movement.getStatus() != StockMovementStatus.EXECUTED) {
            throw new BadRequestException("Only executed stock movements can be reversed");
        }
        if (movement.getReversedByMovementId() != null) {
            throw new BadRequestException("Stock movement has already been reversed");
        }
        if (movement.getReversalOfMovementId() != null) {
            throw new BadRequestException("Reversal movements cannot be reversed again");
        }
    }

    private StockMovementType reversalTypeFor(StockMovement movement) {
        return switch (movement.getMovementType()) {
            case INBOUND -> StockMovementType.OUTBOUND;
            case OUTBOUND -> StockMovementType.INBOUND;
            case TRANSFER_IN -> StockMovementType.TRANSFER_OUT;
            case TRANSFER_OUT -> StockMovementType.TRANSFER_IN;
            case ADJUSTMENT -> StockMovementType.ADJUSTMENT;
            case WRITE_OFF -> StockMovementType.INBOUND;
            case RETURN_IN -> StockMovementType.RETURN_OUT;
            case RETURN_OUT -> StockMovementType.RETURN_IN;
            case RESERVATION -> StockMovementType.RESERVATION_RELEASE;
            case RESERVATION_RELEASE -> StockMovementType.RESERVATION;
        };
    }

    private StockAdjustmentDirection reversalAdjustmentDirectionFor(StockMovement movement) {
        if (movement.getMovementType() != StockMovementType.ADJUSTMENT) {
            return null;
        }
        return movement.getAdjustmentDirection() == StockAdjustmentDirection.DECREASE
                ? StockAdjustmentDirection.INCREASE
                : StockAdjustmentDirection.DECREASE;
    }

    private StockMovementReasonCode reversalReasonFor(StockMovementType reversalType) {
        return switch (reversalType) {
            case INBOUND, TRANSFER_IN -> StockMovementReasonCode.MANUAL_INBOUND;
            case OUTBOUND, TRANSFER_OUT -> StockMovementReasonCode.MANUAL_OUTBOUND;
            case ADJUSTMENT -> StockMovementReasonCode.CORRECTION;
            case WRITE_OFF -> StockMovementReasonCode.DAMAGE_WRITE_OFF;
            case RETURN_IN -> StockMovementReasonCode.RETURN_IN;
            case RETURN_OUT -> StockMovementReasonCode.RETURN_OUT;
            case RESERVATION -> StockMovementReasonCode.STOCK_RESERVED;
            case RESERVATION_RELEASE -> StockMovementReasonCode.RESERVATION_RELEASED;
        };
    }

    private Long reversalBinLocationId(StockMovement original) {
        StockMovementType reversalType = reversalTypeFor(original);
        StockAdjustmentDirection reversalAdjustmentDirection = reversalAdjustmentDirectionFor(original);
        boolean decreaseForAdjustmentOrReservedTransfer = reversalType == StockMovementType.ADJUSTMENT
                ? reversalAdjustmentDirection == StockAdjustmentDirection.DECREASE
                : false;

        if (shouldDecreaseBin(reversalType, reversalAdjustmentDirection, decreaseForAdjustmentOrReservedTransfer)) {
            if (original.getDestinationBin() != null) {
                return original.getDestinationBin().getId();
            }
            return original.getSourceBin() != null ? original.getSourceBin().getId() : null;
        }
        if (shouldIncreaseBin(reversalType, reversalAdjustmentDirection, decreaseForAdjustmentOrReservedTransfer)) {
            if (original.getSourceBin() != null) {
                return original.getSourceBin().getId();
            }
            return original.getDestinationBin() != null ? original.getDestinationBin().getId() : null;
        }
        return null;
    }

    private StockMovementResponse executeCreatedMovement(StockMovement movement) {
        return execute(movement.getId());
    }

    private void executeInventoryEffects(StockMovement movement) {
        Warehouse warehouse = movement.getWarehouse();
        Product product = movement.getProduct();

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouseIdAndProductIdForUpdate(warehouse.getId(), product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        BigDecimal quantityBefore = inventory.getSafeQuantity();
        BigDecimal reservedBefore = inventory.getSafeReservedQuantity();
        BigDecimal availableBefore = inventory.getAvailableQuantity();

        boolean reservedTransportTransferOut = movement.getMovementType() == StockMovementType.TRANSFER_OUT && movement.getTransportOrder() != null;
        boolean decreaseForAdjustmentOrReservedTransfer = movement.getMovementType() == StockMovementType.ADJUSTMENT
                ? movement.getAdjustmentDirection() == StockAdjustmentDirection.DECREASE
                : reservedTransportTransferOut;

        BigDecimal projectedQuantityAfter = projectQuantityAfter(
                inventory,
                movement.getMovementType(),
                movement.getQuantity(),
                decreaseForAdjustmentOrReservedTransfer
        );
        validateWarehouseCapacity(warehouse, quantityBefore, projectedQuantityAfter);

        applyInventoryMovement(
                inventory,
                movement.getMovementType(),
                movement.getQuantity(),
                decreaseForAdjustmentOrReservedTransfer,
                movement.getTransportOrder()
        );

        BigDecimal quantityAfter = inventory.getSafeQuantity();
        BigDecimal reservedAfter = inventory.getSafeReservedQuantity();
        BigDecimal availableAfter = inventory.getAvailableQuantity();
        validateInventoryState(quantityAfter, reservedAfter);
        applyInventoryValuation(inventory, movement, quantityBefore, quantityAfter, decreaseForAdjustmentOrReservedTransfer);

        WarehouseInventory savedInventory = warehouseInventoryRepository.saveAndFlush(inventory);
        BinLocation movementBin = applyOptionalBinMovement(
                warehouse,
                product,
                executableBinLocationId(movement),
                movement.getMovementType(),
                movement.getQuantity(),
                movement.getAdjustmentDirection(),
                savedInventory,
                decreaseForAdjustmentOrReservedTransfer
        );

        recordInventoryQuantityHistory(savedInventory, quantityBefore, quantityAfter, reservedBefore, reservedAfter);

        movement.setQuantityBefore(quantityBefore);
        movement.setQuantityAfter(quantityAfter);
        movement.setReservedBefore(reservedBefore);
        movement.setReservedAfter(reservedAfter);
        movement.setAvailableBefore(availableBefore);
        movement.setAvailableAfter(availableAfter);
        if (movementBin != null) {
            if (shouldDecreaseBin(movement.getMovementType(), movement.getAdjustmentDirection(), decreaseForAdjustmentOrReservedTransfer)) {
                movement.setSourceBin(movementBin);
            }
            if (shouldIncreaseBin(movement.getMovementType(), movement.getAdjustmentDirection(), decreaseForAdjustmentOrReservedTransfer)) {
                movement.setDestinationBin(movementBin);
            }
        }
    }

    private void applyInventoryValuation(
            WarehouseInventory inventory,
            StockMovement movement,
            BigDecimal quantityBefore,
            BigDecimal quantityAfter,
            boolean decreaseForAdjustmentOrReservedTransfer
    ) {
        try {
            inventory.applyWeightedAverageValuation(
                    movement.getMovementType(),
                    movement.getAdjustmentDirection(),
                    quantityBefore,
                    quantityAfter,
                    movement.getQuantity(),
                    movement.getUnitCost(),
                    movement.getTotalCost(),
                    movement.getCurrency(),
                    decreaseForAdjustmentOrReservedTransfer
            );
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new BadRequestException(ex.getMessage());
        }
    }

    private Long executableBinLocationId(StockMovement movement) {
        if (shouldDecreaseBin(movement.getMovementType(), movement.getAdjustmentDirection(), movement.getMovementType() == StockMovementType.TRANSFER_OUT && movement.getTransportOrder() != null)) {
            return movement.getSourceBin() != null ? movement.getSourceBin().getId() : null;
        }
        if (shouldIncreaseBin(movement.getMovementType(), movement.getAdjustmentDirection(), false)) {
            return movement.getDestinationBin() != null ? movement.getDestinationBin().getId() : null;
        }
        return null;
    }

    private BinLocation executedMovementBin(StockMovement movement) {
        return movement.getSourceBin() != null ? movement.getSourceBin() : movement.getDestinationBin();
    }



    @Override
    @Transactional
    public StockMovementResponse reverse(Long id) {
        StockMovement original = getAccessibleStockMovement(id);
        enforceWarehouseScopeForCurrentRole(original.getWarehouse(), true);
        validateMovementCanBeReversed(original);

        StockMovementType reversalType = reversalTypeFor(original);
        StockAdjustmentDirection reversalAdjustmentDirection = reversalAdjustmentDirectionFor(original);
        boolean decreaseForAdjustmentOrReservedTransfer = reversalType == StockMovementType.ADJUSTMENT
                ? reversalAdjustmentDirection == StockAdjustmentDirection.DECREASE
                : false;

        StockMovement reversal = applyMovement(
                original.getWarehouse(),
                original.getProduct(),
                original.getQuantity(),
                reversalType,
                reversalReasonFor(reversalType),
                "Reversal of stock movement #" + original.getId(),
                original.getQuantity(),
                original.getQuantity(),
                null,
                null,
                original.getBatchLotNumber(),
                original.getBatchExpirationDate(),
                parseSerialNumbers(original.getSerialNumbers()),
                original.getUnitCost(),
                original.getTotalCost(),
                original.getCurrency(),
                StockMovementReferenceType.STOCK_MOVEMENT,
                original.getId(),
                "REV-" + original.getId(),
                original.getReasonDescription(),
                reversalType == StockMovementType.TRANSFER_IN || reversalType == StockMovementType.TRANSFER_OUT ? original.getTransferGroupId() : null,
                reversalAdjustmentDirection,
                null,
                reversalBinLocationId(original),
                decreaseForAdjustmentOrReservedTransfer
        );
        reversal.setReversalOfMovementId(original.getId());
        reversal.setRootMovementId(original.getRootMovementId() != null ? original.getRootMovementId() : original.getId());
        reversal = stockMovementRepository.saveAndFlush(reversal);

        StockMovementResponse executedReversal = execute(reversal.getId());
        StockMovement executedReversalEntity = getAccessibleStockMovement(executedReversal.getId());

        var context = lifecycleTransitionEngine.validate(
                LifecycleEntityType.STOCK_MOVEMENT,
                original.getId(),
                StockMovementStatus.class,
                original.getStatus(),
                StockMovementStatus.REVERSED,
                "Reverse stock movement",
                null,
                null
        );
        original.setStatus(StockMovementStatus.REVERSED);
        original.setReversedByMovementId(executedReversalEntity.getId());
        StockMovement savedOriginal = stockMovementRepository.saveAndFlush(original);
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedOriginal.getId(), stockMovementIdentifier(savedOriginal), "status", context.fromStatus(), context.toStatus());
        auditFacade.recordFieldChange("STOCK_MOVEMENT", savedOriginal.getId(), stockMovementIdentifier(savedOriginal), "reversedByMovementId", null, executedReversalEntity.getId());
        lifecycleTransitionEngine.afterTransition(context, StockMovementStatus.class);

        executedReversalEntity.setReversalOfMovementId(savedOriginal.getId());
        executedReversalEntity = stockMovementRepository.saveAndFlush(executedReversalEntity);
        auditFacade.recordFieldChange("STOCK_MOVEMENT", executedReversalEntity.getId(), stockMovementIdentifier(executedReversalEntity), "reversalOfMovementId", null, savedOriginal.getId());
        return toResponseWithLifecycle(executedReversalEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public StockMovementResponse getById(Long id) {
        return toResponseWithLifecycle(getAccessibleStockMovement(id));
    }

    @Override
    @Transactional(readOnly = true)
    public StockMovementTraceResponse trace(Long id) {
        StockMovement movement = getAccessibleStockMovement(id);
        List<StockMovement> related = collectTraceMovements(movement);
        return new StockMovementTraceResponse(
                movement.getId(),
                movement.getRootMovementId() != null ? movement.getRootMovementId() : movement.getId(),
                movement.getParentMovementId(),
                movement.getTransferGroupId(),
                movement.getSourceType(),
                movement.getSourceId(),
                movement.getReferenceCode(),
                related.stream()
                        .sorted(Comparator.comparing(StockMovement::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(StockMovement::getId))
                        .map(this::toResponseWithLifecycle)
                        .toList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AllowedStatusTransitionsResponse allowedStatusTransitions(Long id) {
        StockMovement stockMovement = getAccessibleStockMovement(id);
        return new AllowedStatusTransitionsResponse(
                stockMovement.getStatus().name(),
                lifecycleTransitionEngine.allowedStatusesForCurrentUser(
                        LifecycleEntityType.STOCK_MOVEMENT,
                        StockMovementStatus.class,
                        stockMovement.getStatus()
                ).stream().map(Enum::name).toList(),
                null
        );
    }


    @Override
    @Transactional(readOnly = true)
    public List<StockMovementResponse> batchHistory(String lotNumber) {
        String normalizedLotNumber = normalizeBatchLotNumber(lotNumber);
        if (normalizedLotNumber == null) {
            throw new BadRequestException("Batch/lot number is required");
        }
        List<StockMovement> movements = authenticatedUserProvider.isOverlord()
                ? stockMovementRepository.findByBatchLotNumberOrderByCreatedAtDesc(normalizedLotNumber)
                : stockMovementRepository.findByBatchLotNumberAndWarehouse_Company_IdOrderByCreatedAtDesc(
                        normalizedLotNumber,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );
        return movements.stream().map(this::toResponseWithLifecycle).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovementResponse> serialHistory(String serialNumber) {
        String normalizedSerialNumber = serialNumber == null ? null : serialNumber.trim();
        if (normalizedSerialNumber == null || normalizedSerialNumber.isBlank()) {
            throw new BadRequestException("Serial number is required");
        }
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        return stockMovementRepository.findSerialHistory(normalizedSerialNumber, companyId)
                .stream()
                .map(this::toResponseWithLifecycle)
                .toList();
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
                null,
                null,
                null,
                pageable
        ).map(this::toResponseWithLifecycle));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> search(
            String search,
            StockMovementType movementType,
            StockMovementStatus status,
            StockMovementReasonCode reasonCode,
            Long warehouseId,
            Long productId,
            Long transportOrderId,
            Long binLocationId,
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

        if (binLocationId != null) {
            BinLocation binLocation = getAccessibleBinLocation(binLocationId);
            if (warehouseId != null) {
                binIntegrityValidator.ensureBinBelongsToWarehouse(
                        binLocation,
                        getAccessibleWarehouse(warehouseId),
                        "Bin location must belong to selected warehouse"
                );
            }
        }

        Page<StockMovement> page;
        if (authenticatedUserProvider.hasRole("WORKER")) {
            page = stockMovementRepository.searchMovementsAssignedToEmployee(
                    companyId,
                    currentEmployeeIdOrNotFound(),
                    normalizedSearch,
                    searchId,
                    movementType,
                    status,
                    reasonCode,
                    warehouseId,
                    productId,
                    transportOrderId,
                    binLocationId,
                    fromDate,
                    toDate,
                    pageable
            );
        } else {
            List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
            if (scopedWarehouseIds != null) {
                page = scopedWarehouseIds.isEmpty()
                        ? Page.empty(pageable)
                        : stockMovementRepository.searchMovementsForWarehouseIds(
                        companyId,
                        scopedWarehouseIds,
                        normalizedSearch,
                        searchId,
                        movementType,
                        status,
                        reasonCode,
                        warehouseId,
                        productId,
                        transportOrderId,
                        binLocationId,
                        fromDate,
                        toDate,
                        pageable
                );
            } else {
                page = stockMovementRepository.searchMovements(
                        companyId,
                        normalizedSearch,
                        searchId,
                        movementType,
                        status,
                        reasonCode,
                        warehouseId,
                        productId,
                        transportOrderId,
                        binLocationId,
                        fromDate,
                        toDate,
                        pageable
                );
            }
        }

        return PageResponse.from(page.map(this::toResponseWithLifecycle));
    }

    private StockMovementResponse toResponseWithLifecycle(StockMovement stockMovement) {
        return StockMovementMapper.toResponse(
                stockMovement,
                lifecycleTransitionEngine.allowedStatuses(
                        LifecycleEntityType.STOCK_MOVEMENT,
                        StockMovementStatus.class,
                        stockMovement.getStatus()
                ).stream().toList()
        );
    }

    private List<StockMovement> collectTraceMovements(StockMovement movement) {
        Map<Long, StockMovement> related = new LinkedHashMap<>();
        addTraceMovements(related, List.of(movement));

        Long rootId = movement.getRootMovementId() != null ? movement.getRootMovementId() : movement.getId();
        addTraceMovements(related, movementsByRoot(rootId));
        addTraceMovements(related, movementsByParent(movement.getId()));

        if (movement.getParentMovementId() != null) {
            StockMovement parent = getAccessibleStockMovement(movement.getParentMovementId());
            addTraceMovements(related, List.of(parent));
            addTraceMovements(related, movementsByParent(parent.getId()));
        }

        if (movement.getTransferGroupId() != null && !movement.getTransferGroupId().isBlank()) {
            addTraceMovements(related, movementsByTransferGroup(movement.getTransferGroupId()));
        }

        if (movement.getReferenceType() == StockMovementReferenceType.STOCK_MOVEMENT && movement.getReferenceId() != null) {
            StockMovement referenced = getAccessibleStockMovement(movement.getReferenceId());
            addTraceMovements(related, List.of(referenced));
            Long referencedRootId = referenced.getRootMovementId() != null ? referenced.getRootMovementId() : referenced.getId();
            addTraceMovements(related, movementsByRoot(referencedRootId));
        }

        if (movement.getTransportOrder() != null) {
            addTraceMovements(related, authenticatedUserProvider.isOverlord()
                    ? stockMovementRepository.findByTransportOrder_Id(movement.getTransportOrder().getId())
                    : stockMovementRepository.findByTransportOrder_IdAndWarehouse_Company_Id(
                            movement.getTransportOrder().getId(),
                            authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                    ));
        }

        return new ArrayList<>(related.values());
    }

    private void addTraceMovements(Map<Long, StockMovement> target, List<StockMovement> movements) {
        for (StockMovement candidate : movements) {
            if (candidate != null && candidate.getId() != null) {
                target.put(candidate.getId(), candidate);
            }
        }
    }

    private List<StockMovement> movementsByRoot(Long rootMovementId) {
        if (rootMovementId == null) {
            return List.of();
        }
        return authenticatedUserProvider.isOverlord()
                ? stockMovementRepository.findByRootMovementIdOrderByCreatedAtAsc(rootMovementId)
                : stockMovementRepository.findByRootMovementIdAndWarehouse_Company_IdOrderByCreatedAtAsc(
                        rootMovementId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );
    }

    private List<StockMovement> movementsByParent(Long parentMovementId) {
        if (parentMovementId == null) {
            return List.of();
        }
        return stockMovementRepository.findByParentMovementIdOrderByCreatedAtAsc(parentMovementId).stream()
                .filter(candidate -> authenticatedUserProvider.isOverlord()
                        || candidate.getWarehouse().getCompany().getId().equals(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()))
                .toList();
    }

    private List<StockMovement> movementsByTransferGroup(String transferGroupId) {
        return authenticatedUserProvider.isOverlord()
                ? stockMovementRepository.findByTransferGroupIdOrderByCreatedAtAsc(transferGroupId)
                : stockMovementRepository.findByTransferGroupIdAndWarehouse_Company_IdOrderByCreatedAtAsc(
                        transferGroupId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );
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

    private void recordBinInventoryQuantityHistory(BinInventory inventory, BigDecimal quantityBefore, BigDecimal quantityAfter) {
        auditFacade.recordFieldChange(
                "BIN_INVENTORY",
                inventory.getBinLocation().getId(),
                binInventoryIdentifier(inventory),
                "quantity",
                quantityBefore,
                quantityAfter
        );
    }

    private String binInventoryIdentifier(BinInventory inventory) {
        return "binLocationId=" + inventory.getBinLocation().getId()
                + ",productId=" + inventory.getProduct().getId();
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

    private void recordStockMovementDomainEvent(StockMovement movement, Warehouse warehouse, Product product, BinLocation movementBin) {
        domainEventService.record(
                DomainEventType.INVENTORY_LIFECYCLE,
                OperationalEntityType.STOCK_MOVEMENT,
                movement.getId(),
                stockMovementIdentifier(movement),
                "Stock movement applied",
                "{\"movementId\":" + movement.getId()
                        + ",\"movementType\":\"" + movement.getMovementType() + "\""
                        + ",\"reasonCode\":\"" + movement.getReasonCode() + "\""
                        + ",\"warehouseId\":" + warehouse.getId()
                        + ",\"productId\":" + product.getId()
                        + ",\"quantity\":\"" + movement.getQuantity() + "\""
                        + ",\"quantityBefore\":\"" + movement.getQuantityBefore() + "\""
                        + ",\"quantityAfter\":\"" + movement.getQuantityAfter() + "\""
                        + ",\"reservedBefore\":\"" + movement.getReservedBefore() + "\""
                        + ",\"reservedAfter\":\"" + movement.getReservedAfter() + "\""
                        + ",\"availableBefore\":\"" + movement.getAvailableBefore() + "\""
                        + ",\"availableAfter\":\"" + movement.getAvailableAfter() + "\""
                        + ",\"binLocationId\":" + (movementBin != null ? movementBin.getId() : null)
                        + ",\"sourceBinId\":" + (movement.getSourceBin() != null ? movement.getSourceBin().getId() : null)
                        + ",\"destinationBinId\":" + (movement.getDestinationBin() != null ? movement.getDestinationBin().getId() : null)
                        + "}",
                warehouse.getCompany() != null ? warehouse.getCompany().getId() : null
        );
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

    private BinLocation getAccessibleBinLocation(Long binLocationId) {
        if (authenticatedUserProvider.isOverlord()) {
            return binLocationRepository.findById(binLocationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Bin location not found"));
        }

        return binLocationRepository.findByIdAndWarehouse_Company_Id(
                        binLocationId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Bin location not found"));
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

    private StockMovement getAccessibleStockMovement(Long id) {
        StockMovement movement = authenticatedUserProvider.isOverlord()
                ? stockMovementRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found"))
                : stockMovementRepository.findByIdAndWarehouse_Company_Id(
                        id,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement not found"));
        enforceWarehouseScopeForCurrentRole(movement.getWarehouse(), false);
        if (authenticatedUserProvider.hasRole("WORKER")
                && !stockMovementRepository.existsAssignedWorkerTaskForStockMovement(id, currentEmployeeIdOrNotFound())) {
            throw new ResourceNotFoundException("Stock movement not found");
        }
        return movement;
    }

    private Long currentEmployeeIdOrNotFound() {
        return employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId())
                .map(Employee::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
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
