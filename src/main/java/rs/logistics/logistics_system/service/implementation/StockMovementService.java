package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.StockMovementUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.StockMovementMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockMovementService implements StockMovementServiceDefinition {

    private final StockMovementRepository _stockMovementRepository;
    private final WarehouseRepository _warehouseRepository;
    private final ProductRepository _productRepository;
    private final UserRepository _userRepository;


    @Override
    public StockMovementResponse create(StockMovementCreate dto) {
        Warehouse warehouse = _warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
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
}
