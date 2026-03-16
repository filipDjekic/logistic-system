package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.StockMovementUpdate;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.StockMovementMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;

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

    private final WarehouseInventoryRepository _warehouseInventoryRepository;


    @Override
    public StockMovementResponse create(StockMovementCreate dto) {
        Warehouse warehouse = _warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        WarehouseInventory inventory = _warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(warehouse.getId(), product.getId())
                .orElseGet(() -> {
                    if (dto.getMovementType() != StockMovementType.INBOUND) {
                        throw new ResourceNotFoundException("Inventory not found");
                    }

                    WarehouseInventory newInventory = new WarehouseInventory();
                    newInventory.setWarehouse(warehouse);
                    newInventory.setProduct(product);
                    newInventory.setQuantity(BigDecimal.ZERO);
                    newInventory.setReservedQuantity(BigDecimal.ZERO);
                    newInventory.setMinStockLevel(BigDecimal.ZERO);

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

        User user = _userRepository.findById(dto.getCreatedById()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        StockMovement stockMovement = StockMovementMapper.toEntity(dto, warehouse, product, user);
        StockMovement saved = _stockMovementRepository.save(stockMovement);
        return StockMovementMapper.toResponse(saved);
    }

    @Override
    public StockMovementResponse update(Long id, StockMovementUpdate dto) {
        Warehouse warehouse = _warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = _userRepository.findById(dto.getCreatedById()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        StockMovement stockMovement = _stockMovementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"));

        StockMovementMapper.updateEntity(stockMovement, dto, warehouse, product, user);
        StockMovement saved = _stockMovementRepository.save(stockMovement);
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
    }

    // helpers

    private void increaseInventory(WarehouseInventory inventory, BigDecimal quantity){
        inventory.setQuantity(inventory.getQuantity().add(quantity));
    }

    private void decreaseInventory(WarehouseInventory inventory, BigDecimal quantity){
        if(inventory.getQuantity().compareTo(quantity) <= 0){
            throw new BadRequestException("Not enough in stock");
        }

        inventory.setQuantity(inventory.getQuantity().subtract(quantity));
    }

    private void adjustInventory(WarehouseInventory inventory, BigDecimal quantity){
        inventory.setQuantity(quantity);
    }

    private void checkMovementQuantity(BigDecimal quantity){
        if(quantity == null ||  quantity.compareTo(BigDecimal.ZERO) <= 0){
            throw new BadRequestException("Quantity must be greater than zero");
        }
    }
}
