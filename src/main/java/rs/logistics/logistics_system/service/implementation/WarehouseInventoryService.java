package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
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

    @Override
    public WarehouseInventoryResponse create(WarehouseInventoryCreate dto) {
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        checkIfExists(dto.getWarehouseId(), dto.getProductId());
        checkQuantity(dto.getQuantity());
        checkReservedQuantity(dto.getReservedQuantity());
        checkIfQuantityLessThanReserved(dto.getReservedQuantity(), dto.getQuantity());

        WarehouseInventory warehouseInventory = WarehouseInventoryMapper.toEntity(dto, warehouse, product);
        warehouseInventoryRepository.save(warehouseInventory);
        return WarehouseInventoryMapper.toResponse(warehouseInventory);
    }

    @Override
    public WarehouseInventoryResponse update(Long warehouseId, Long productId, WarehouseInventoryUpdate dto) {
        WarehouseInventory inventory = warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouseId, productId).orElseThrow(() -> new ResourceNotFoundException("WarehouseInventory not found"));
        Warehouse warehouse = warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        checkQuantity(dto.getQuantity());
        checkReservedQuantity(dto.getReservedQuantity());
        checkIfQuantityLessThanReserved(dto.getReservedQuantity(), dto.getQuantity());

        WarehouseInventoryMapper.updateEntity(dto, warehouse, product, inventory);
        warehouseInventoryRepository.save(inventory);
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
        warehouseInventoryRepository.delete(inventory);
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

    private void checkReservedQuantity(BigDecimal reservedQuantity) {
        if(reservedQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Reserved quantity cannot be less than zero");
        }
    }

    private void checkIfQuantityLessThanReserved(BigDecimal quantity, BigDecimal reservedQuantity) {
        if(quantity.compareTo(reservedQuantity) < 0) {
            throw new BadRequestException("Reserved quantity cannot be greater than quantity");
        }
    }
}
