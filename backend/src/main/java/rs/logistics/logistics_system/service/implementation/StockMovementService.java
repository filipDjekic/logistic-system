package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
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

import java.math.BigDecimal;
import java.util.List;
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

    @Override
    @Transactional
    public StockMovementResponse create(StockMovementCreate dto) {
        Warehouse warehouse = getAccessibleWarehouse(dto.getWarehouseId());
        Product product = getAccessibleProduct(dto.getProductId());
        validateSameCompany(warehouse, product);

        WarehouseInventory inventory = warehouseInventoryRepository
                .findByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found"));

        User currentUser = authenticatedUserProvider.getAuthenticatedUser();
        TransportOrder transportOrder = resolveTransportOrder(dto.getTransportOrderId(), warehouse);

        BigDecimal quantityBefore = defaultZero(inventory.getQuantity());
        BigDecimal reservedBefore = defaultZero(inventory.getReservedQuantity());
        BigDecimal availableBefore = quantityBefore.subtract(reservedBefore);
        BigDecimal movementQuantity = defaultZero(dto.getQuantity());

        if (movementQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Movement quantity must be greater than zero");
        }

        BigDecimal quantityAfter;
        BigDecimal reservedAfter = reservedBefore;

        switch (dto.getMovementType()) {
            case INBOUND, TRANSFER_IN -> quantityAfter = quantityBefore.add(movementQuantity);
            case OUTBOUND, TRANSFER_OUT -> {
                if (availableBefore.compareTo(movementQuantity) < 0) {
                    throw new BadRequestException("Not enough available quantity for outbound movement");
                }
                quantityAfter = quantityBefore.subtract(movementQuantity);
            }
            case ADJUSTMENT -> quantityAfter = quantityBefore.add(movementQuantity);
            default -> throw new BadRequestException("Unsupported stock movement type");
        }

        if (quantityAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Quantity after movement cannot be negative");
        }

        BigDecimal availableAfter = quantityAfter.subtract(reservedAfter);

        inventory.setQuantity(quantityAfter);
        warehouseInventoryRepository.save(inventory);

        StockMovement stockMovement = StockMovementMapper.toEntity(
                dto,
                warehouse,
                product,
                currentUser,
                transportOrder,
                quantityBefore,
                quantityAfter,
                reservedBefore,
                reservedAfter,
                availableBefore,
                availableAfter
        );

        StockMovement saved = stockMovementRepository.save(stockMovement);

        auditFacade.recordCreate("STOCK_MOVEMENT", saved.getId());
        auditFacade.log(
                "CREATE",
                "STOCK_MOVEMENT",
                saved.getId(),
                "Stock movement created (ID: " + saved.getId()
                        + ", warehouseId=" + warehouse.getId()
                        + ", productId=" + product.getId() + ")"
        );

        createOperationalTaskForStockMovement(saved);

        return StockMovementMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public StockMovementResponse getById(Long id) {
        return StockMovementMapper.toResponse(getAccessibleStockMovement(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovementResponse> getAll() {
        List<StockMovement> movements = authenticatedUserProvider.isOverlord()
                ? stockMovementRepository.findAll()
                : stockMovementRepository.findAllByWarehouse_Company_Id(
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return movements.stream()
                .map(StockMovementMapper::toResponse)
                .collect(Collectors.toList());
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
                java.time.LocalDateTime.now().plusHours(1),
                TaskPriority.MEDIUM,
                assignee.getId(),
                stockMovement.getTransportOrder() != null ? stockMovement.getTransportOrder().getId() : null,
                stockMovement.getId()
        ));
    }

    private boolean shouldCreateOperationalTask(StockMovement stockMovement) {
        return stockMovement.getMovementType() == rs.logistics.logistics_system.enums.StockMovementType.OUTBOUND
                || stockMovement.getMovementType() == rs.logistics.logistics_system.enums.StockMovementType.TRANSFER_OUT
                || stockMovement.getMovementType() == rs.logistics.logistics_system.enums.StockMovementType.TRANSFER_IN
                || stockMovement.getMovementType() == rs.logistics.logistics_system.enums.StockMovementType.INBOUND;
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

    private BigDecimal defaultZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}