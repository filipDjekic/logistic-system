package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderItemMapper;
import rs.logistics.logistics_system.repository.*;
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
    private final WarehouseRepository _warehouseRepository;
    private final WarehouseInventoryRepository _warehouseInventoryRepository;

    @Override
    public TransportOrderItemResponse create(TransportOrderItemCreate dto) {

        if(dto.getQuantity().compareTo(BigDecimal.ZERO) < 0){
            throw new BadRequestException("Quantity must be greater than 0");
        }

        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            throw new BadRequestException("Items can only be added while transport order is in CREATED status");
        }

        Product product =  _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product Not Found"));

        if(_transportOrderItemRepository.existsByTransportOrderIdAndProductId(dto.getTransportOrderId(), dto.getProductId())){
            throw new ConflictException("Transport Order Item Already Exists");
        }

        Warehouse sourceWarehouse = _warehouseRepository.findById(transportOrder.getSourceWarehouse().getId()).orElseThrow(() -> new ResourceNotFoundException("Source Warehouse Not Found"));
        WarehouseInventory warehouseInventory = _warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(sourceWarehouse.getId(), product.getId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse Inventory Not Found"));

        if(warehouseInventory.getQuantity().compareTo(BigDecimal.ZERO) <= 0){
            throw new BadRequestException("Not enough stock");
        }

        TransportOrderItem transportOrderItem = TransportOrderItemMapper.toEntity(dto,transportOrder,product);
        TransportOrderItem saved =  _transportOrderItemRepository.save(transportOrderItem);
        return TransportOrderItemMapper.toResponse(saved);
    }

    @Override
    public TransportOrderItemResponse update(Long id, TransportOrderItemUpdate dto) {
        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            throw new BadRequestException("Items can only be modified while transport order is in CREATED status");
        }

        Product product =  _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product Not Found"));

        TransportOrderItem transportOrderItem = _transportOrderItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

        if (dto.getQuantity() == null || dto.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }

        Warehouse sourceWarehouse = _warehouseRepository.findById(transportOrder.getSourceWarehouse().getId()).orElseThrow(() -> new ResourceNotFoundException("Source Warehouse Not Found"));

        WarehouseInventory warehouseInventory = _warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(sourceWarehouse.getId(), product.getId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse Inventory Not Found"));

        BigDecimal currentReservedByThisItem = BigDecimal.ZERO;
        if (transportOrderItem.getProduct().getId().equals(product.getId())) {
            currentReservedByThisItem = transportOrderItem.getQuantity();
        }

        BigDecimal effectiveAvailable = warehouseInventory.getAvailableQuantity().add(currentReservedByThisItem);

        if (effectiveAvailable.compareTo(dto.getQuantity()) < 0) {
            throw new BadRequestException("Not enough available stock");
        }

        TransportOrderItemMapper.updateEntity(dto, transportOrderItem,transportOrder,product);

        TransportOrderItem updated =  _transportOrderItemRepository.save(transportOrderItem);
        return TransportOrderItemMapper.toResponse(updated);

    }

    @Override
    public TransportOrderItemResponse getById(Long id) {
        TransportOrderItem transportOrderItem = _transportOrderItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));
        return TransportOrderItemMapper.toResponse(transportOrderItem);
    }

    @Override
    public List<TransportOrderItemResponse> getAll() {
        return _transportOrderItemRepository.findAll().stream().map(TransportOrderItemMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        TransportOrderItem transportOrderItem = _transportOrderItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

        TransportOrder transportOrder = _transportOrderRepository.findById(transportOrderItem.getTransportOrder().getId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));
        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            throw new BadRequestException("Items can only be removed while transport order is in CREATED status");
        }
        _transportOrderItemRepository.delete(transportOrderItem);
    }
}
