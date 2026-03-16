package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.TransportOrderItemCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderItemResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderItemUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.TransportOrderItem;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderItemMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.service.definition.TransportOrderItemServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransportOrderItemService implements TransportOrderItemServiceDefinition {

    private final TransportOrderItemRepository _transportOrderItemRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final ProductRepository _productRepository;

    @Override
    public TransportOrderItemResponse create(TransportOrderItemCreate dto) {

        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));
        Product product =  _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product Not Found"));

        TransportOrderItem transportOrderItem = TransportOrderItemMapper.toEntity(dto,transportOrder,product);
        TransportOrderItem saved =  _transportOrderItemRepository.save(transportOrderItem);
        return TransportOrderItemMapper.toResponse(saved);
    }

    @Override
    public TransportOrderItemResponse update(Long id, TransportOrderItemUpdate dto) {
        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));
        Product product =  _productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product Not Found"));

        TransportOrderItem transportOrderItem = _transportOrderItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport Order Not Found"));

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
        _transportOrderItemRepository.delete(transportOrderItem);
    }
}
