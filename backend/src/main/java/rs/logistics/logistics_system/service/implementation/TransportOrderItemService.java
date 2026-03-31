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

    @Override
    @Transactional
    public TransportOrderItemResponse create(TransportOrderItemCreate dto) {

        validateRequestedQuantity(dto.getQuantity());

        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

        validateTransportOrderEditable(transportOrder);

        Product product = _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product Not Found"));

        if (_transportOrderItemRepository.existsByTransportOrderIdAndProductId(dto.getTransportOrderId(), dto.getProductId())) {
            throw new ConflictException("Transport Order Item Already Exists");
        }

        WarehouseInventory warehouseInventory = _warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(transportOrder.getSourceWarehouse().getId(), product.getId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse Inventory Not Found"));

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

        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

        validateTransportOrderEditable(transportOrder);

        Product product = _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product Not Found"));

        TransportOrderItem transportOrderItem = _transportOrderItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport Order Item Not Found"));

        TransportOrder previousTransportOrder = transportOrderItem.getTransportOrder();

        WarehouseInventory warehouseInventory = _warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(transportOrder.getSourceWarehouse().getId(), product.getId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse Inventory Not Found"));

        BigDecimal currentReservedByThisItem = BigDecimal.ZERO;
        if (transportOrderItem.getProduct().getId().equals(product.getId())) {
            currentReservedByThisItem = transportOrderItem.getQuantity();
        }

        BigDecimal effectiveAvailable = warehouseInventory.getAvailableQuantity().add(currentReservedByThisItem);

        if (effectiveAvailable.compareTo(dto.getQuantity()) < 0) {
            throw new BadRequestException("Not enough available stock");
        }

        validateProjectedVehicleCapacityOnUpdate(transportOrderItem, transportOrder, product, dto.getQuantity());

        TransportOrderItemMapper.updateEntity(dto, transportOrderItem, transportOrder, product);

        TransportOrderItem updated = _transportOrderItemRepository.save(transportOrderItem);

        if (previousTransportOrder != null && !previousTransportOrder.getId().equals(transportOrder.getId())) {
            previousTransportOrder.getTransportOrderItems().removeIf(item -> item.getId().equals(updated.getId()));
            recalculateAndPersistOrderTotalWeight(previousTransportOrder);

            transportOrder.getTransportOrderItems().add(updated);
        }

        recalculateAndPersistOrderTotalWeight(transportOrder);

        return TransportOrderItemMapper.toResponse(updated);
    }

    @Override
    public TransportOrderItemResponse getById(Long id) {
        TransportOrderItem transportOrderItem = _transportOrderItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport Order Item Not Found"));
        return TransportOrderItemMapper.toResponse(transportOrderItem);
    }

    @Override
    public List<TransportOrderItemResponse> getAll() {
        return _transportOrderItemRepository.findAll().stream().map(TransportOrderItemMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TransportOrderItem transportOrderItem = _transportOrderItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport Order Item Not Found"));

        TransportOrder transportOrder = _transportOrderRepository.findById(transportOrderItem.getTransportOrder().getId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

        validateTransportOrderEditable(transportOrder);

        transportOrder.getTransportOrderItems().removeIf(item -> item.getId().equals(transportOrderItem.getId()));
        _transportOrderItemRepository.delete(transportOrderItem);
        recalculateAndPersistOrderTotalWeight(transportOrder);
    }

    // helpers

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
}