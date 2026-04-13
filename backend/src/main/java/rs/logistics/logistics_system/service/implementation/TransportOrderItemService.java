package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.TransportOrderItem;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderItemMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.TransportOrderItemServiceDefinition;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransportOrderItemService implements TransportOrderItemServiceDefinition {

    private final TransportOrderItemRepository _transportOrderItemRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final ProductRepository _productRepository;
    private final WarehouseInventoryRepository _warehouseInventoryRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional
    public TransportOrderItemResponse create(TransportOrderItemCreate dto) {

        validateRequestedQuantity(dto.getQuantity());

        TransportOrder transportOrder = getTransportOrderOrThrow(dto.getTransportOrderId());

        validateTransportOrderEditable(transportOrder);

        Product product = getProductOrThrow(dto.getProductId());
        validateProductWeight(product);
        validateSharedCompanyContext(transportOrder, product);

        validateInventoryContextForTransportOrder(transportOrder, product);

        if (_transportOrderItemRepository.existsByTransportOrderIdAndProductId(dto.getTransportOrderId(), dto.getProductId())) {
            throw new ConflictException("Transport Order Item Already Exists");
        }

        WarehouseInventory warehouseInventory = getWarehouseInventoryForTransportOrder(transportOrder, product);

        validateAvailableQuantity(warehouseInventory, dto.getQuantity());

        TransportOrderItem transportOrderItem = TransportOrderItemMapper.toEntity(dto, transportOrder, product);

        validateProjectedVehicleCapacityOnCreate(transportOrder, transportOrderItem);

        TransportOrderItem saved = _transportOrderItemRepository.save(transportOrderItem);

        transportOrder.getTransportOrderItems().add(saved);
        recalculateAndPersistOrderTotalWeight(transportOrder);

        return TransportOrderItemMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public TransportOrderItemResponse update(Long id, TransportOrderItemUpdate dto) {

        validateRequestedQuantity(dto.getQuantity());

        TransportOrder transportOrderItemTargetOrder = getTransportOrderOrThrow(dto.getTransportOrderId());

        validateTransportOrderEditable(transportOrderItemTargetOrder);

        Product product = getProductOrThrow(dto.getProductId());
        validateProductWeight(product);
        validateSharedCompanyContext(transportOrderItemTargetOrder, product);

        validateInventoryContextForTransportOrder(transportOrderItemTargetOrder, product);

        TransportOrderItem transportOrderItem = getTransportOrderItemOrThrow(id);

        if (_transportOrderItemRepository.existsByTransportOrderIdAndProductIdAndIdNot(dto.getTransportOrderId(), dto.getProductId(), id)) {
            throw new ConflictException("Transport Order Item Already Exists");
        }

        TransportOrder previousTransportOrder = transportOrderItem.getTransportOrder();
        validateSharedCompanyContext(previousTransportOrder, transportOrderItem.getProduct());

        WarehouseInventory warehouseInventory = getWarehouseInventoryForTransportOrder(transportOrderItemTargetOrder, product);

        BigDecimal currentReservedByThisItem = BigDecimal.ZERO;
        if (transportOrderItem.getProduct().getId().equals(product.getId())) {
            currentReservedByThisItem = transportOrderItem.getQuantity();
        }

        BigDecimal effectiveAvailable = warehouseInventory.getAvailableQuantity().add(currentReservedByThisItem);

        if (effectiveAvailable.compareTo(dto.getQuantity()) < 0) {
            throw new BadRequestException("Not enough available stock");
        }

        validateProjectedVehicleCapacityOnUpdate(transportOrderItem, transportOrderItemTargetOrder, product, dto.getQuantity());

        TransportOrderItemMapper.updateEntity(dto, transportOrderItem, transportOrderItemTargetOrder, product);

        TransportOrderItem updated = _transportOrderItemRepository.save(transportOrderItem);

        if (previousTransportOrder != null && !previousTransportOrder.getId().equals(transportOrderItemTargetOrder.getId())) {
            previousTransportOrder.getTransportOrderItems().removeIf(item -> item.getId().equals(updated.getId()));
            recalculateAndPersistOrderTotalWeight(previousTransportOrder);

            transportOrderItemTargetOrder.getTransportOrderItems().add(updated);
        }

        recalculateAndPersistOrderTotalWeight(transportOrderItemTargetOrder);

        return TransportOrderItemMapper.toResponse(updated);
    }

    @Override
    public TransportOrderItemResponse getById(Long id) {
        TransportOrderItem transportOrderItem = getTransportOrderItemOrThrow(id);
        return TransportOrderItemMapper.toResponse(transportOrderItem);
    }

    @Override
    public List<TransportOrderItemResponse> getAll() {
        List<TransportOrderItem> items = authenticatedUserProvider.isOverlord()
                ? _transportOrderItemRepository.findAll()
                : _transportOrderItemRepository.findAllByTransportOrder_CreatedBy_Company_Id(
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return items.stream().map(TransportOrderItemMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TransportOrderItem transportOrderItem = getTransportOrderItemOrThrow(id);

        TransportOrder transportOrder = getTransportOrderOrThrow(transportOrderItem.getTransportOrder().getId());

        validateTransportOrderEditable(transportOrder);

        transportOrder.getTransportOrderItems().removeIf(item -> item.getId().equals(transportOrderItem.getId()));
        _transportOrderItemRepository.delete(transportOrderItem);
        recalculateAndPersistOrderTotalWeight(transportOrder);
    }

    private TransportOrder getTransportOrderOrThrow(Long transportOrderId) {
        return authenticatedUserProvider.isOverlord()
                ? _transportOrderRepository.findById(transportOrderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"))
                : _transportOrderRepository.findByIdAndCreatedBy_Company_Id(
                        transportOrderId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                ).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));
    }

    private Product getProductOrThrow(Long productId) {
        return authenticatedUserProvider.isOverlord()
                ? _productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product Not Found"))
                : _productRepository.findByIdAndCompany_Id(
                        productId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                ).orElseThrow(() -> new ResourceNotFoundException("Product Not Found"));
    }

    private TransportOrderItem getTransportOrderItemOrThrow(Long id) {
        return authenticatedUserProvider.isOverlord()
                ? _transportOrderItemRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Transport Order Item Not Found"))
                : _transportOrderItemRepository.findByIdAndTransportOrder_CreatedBy_Company_Id(
                        id,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                ).orElseThrow(() -> new ResourceNotFoundException("Transport Order Item Not Found"));
    }

    private WarehouseInventory getWarehouseInventoryForTransportOrder(TransportOrder transportOrder, Product product) {
        if (authenticatedUserProvider.isOverlord()) {
            return _warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(
                    transportOrder.getSourceWarehouse().getId(),
                    product.getId()
            ).orElseThrow(() -> new ResourceNotFoundException("Warehouse Inventory Not Found"));
        }

        return _warehouseInventoryRepository.findByWarehouse_IdAndProduct_IdAndWarehouse_Company_Id(
                transportOrder.getSourceWarehouse().getId(),
                product.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ).orElseThrow(() -> new ResourceNotFoundException("Warehouse Inventory Not Found"));
    }

    private void validateSharedCompanyContext(TransportOrder transportOrder, Product product) {
        if (transportOrder == null || product == null) {
            throw new BadRequestException("Transport order and product are required");
        }

        Long transportCompanyId = transportOrder.getCreatedBy() != null && transportOrder.getCreatedBy().getCompany() != null
                ? transportOrder.getCreatedBy().getCompany().getId()
                : null;
        Long productCompanyId = product.getCompany() != null ? product.getCompany().getId() : null;

        if (transportCompanyId == null || productCompanyId == null || !transportCompanyId.equals(productCompanyId)) {
            throw new BadRequestException("Transport order and product must belong to the same company");
        }
    }

    private void validateRequestedQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }
    }

    private void validateTransportOrderEditable(TransportOrder transportOrder) {
        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            throw new BadRequestException("Items can only be modified while transport order is in CREATED status");
        }
    }

    private void validateAvailableQuantity(WarehouseInventory warehouseInventory, BigDecimal requestedQuantity) {
        if (warehouseInventory.getAvailableQuantity().compareTo(requestedQuantity) < 0) {
            throw new BadRequestException("Not enough available stock");
        }
    }

    private void recalculateAndPersistOrderTotalWeight(TransportOrder transportOrder) {
        transportOrder.recalculateTotalWeight();
        validateVehicleCapacity(transportOrder);
        _transportOrderRepository.save(transportOrder);
    }

    private void validateVehicleCapacity(TransportOrder transportOrder) {
        if (!transportOrder.fitsAssignedVehicleCapacity()) {
            throw new BadRequestException("Total weight exceeds vehicle capacity");
        }
    }

    private void validateProjectedVehicleCapacityOnCreate(TransportOrder transportOrder, TransportOrderItem newItem) {
        BigDecimal currentTotalWeight = transportOrder.getTotalWeight() != null ? transportOrder.getTotalWeight() : transportOrder.calculateTotalWeight();

        BigDecimal newItemWeight = newItem.getWeight() != null ? newItem.getWeight() : BigDecimal.ZERO;

        BigDecimal projectedTotalWeight = currentTotalWeight.add(newItemWeight);

        validateProjectedVehicleCapacity(transportOrder, projectedTotalWeight);
    }

    private void validateProjectedVehicleCapacityOnUpdate(TransportOrderItem existingItem, TransportOrder targetOrder, Product targetProduct, BigDecimal targetQuantity) {
        BigDecimal oldWeight = existingItem.getWeight() != null ? existingItem.getWeight() : BigDecimal.ZERO;

        BigDecimal newWeightPerUnit = targetProduct.getWeight() != null ? targetProduct.getWeight() : BigDecimal.ZERO;

        BigDecimal newWeight = newWeightPerUnit.multiply(targetQuantity);

        if (existingItem.getTransportOrder().getId().equals(targetOrder.getId())) {
            BigDecimal currentTotalWeight = targetOrder.getTotalWeight() != null ? targetOrder.getTotalWeight() : targetOrder.calculateTotalWeight();

            BigDecimal projectedTotalWeight = currentTotalWeight.subtract(oldWeight).add(newWeight);
            validateProjectedVehicleCapacity(targetOrder, projectedTotalWeight);
            return;
        }

        BigDecimal targetOrderCurrentWeight = targetOrder.getTotalWeight() != null ? targetOrder.getTotalWeight() : targetOrder.calculateTotalWeight();

        BigDecimal projectedTargetOrderWeight = targetOrderCurrentWeight.add(newWeight);
        validateProjectedVehicleCapacity(targetOrder, projectedTargetOrderWeight);
    }

    private void validateProjectedVehicleCapacity(TransportOrder transportOrder, BigDecimal projectedTotalWeight) {
        BigDecimal previousTotalWeight = transportOrder.getTotalWeight();

        transportOrder.setTotalWeight(projectedTotalWeight);

        if (!transportOrder.fitsAssignedVehicleCapacity()) {
            transportOrder.setTotalWeight(previousTotalWeight);
            throw new BadRequestException("Total weight exceeds vehicle capacity");
        }

        transportOrder.setTotalWeight(previousTotalWeight);
    }

    private void validateInventoryContextForTransportOrder(TransportOrder transportOrder, Product product) {
        if (transportOrder == null) {
            throw new BadRequestException("Transport order is required");
        }

        if (transportOrder.getSourceWarehouse() == null || transportOrder.getSourceWarehouse().getId() == null) {
            throw new BadRequestException("Transport order source warehouse is required");
        }

        if (!transportOrder.getSourceWarehouse().isOperational()) {
            throw new BadRequestException("Source warehouse is not operational for inventory operations");
        }

        if (product == null || product.getId() == null) {
            throw new BadRequestException("Product is required");
        }

        if (!product.isOperational()) {
            throw new BadRequestException("Product is not active");
        }
    }

    private void validateProductWeight(Product product) {
        if (product.getWeight() == null || product.getWeight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Product weight must be defined and greater than zero");
        }
    }
}
