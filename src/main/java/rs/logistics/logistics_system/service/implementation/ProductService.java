package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.response.ProductResponse;
import rs.logistics.logistics_system.dto.update.ProductUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ProductMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.service.definition.ProductServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService implements ProductServiceDefinition {

    private final ProductRepository _productRepository;

    @Override
    public ProductResponse create(ProductCreate dto) {
        Product product = ProductMapper.toEntity(dto);
        Product saved = _productRepository.save(product);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse update(Long id, ProductUpdate dto) {
        Product product = _productRepository.findById(id).orElseThrow(() ->  new ResourceNotFoundException("Product not found"));
        ProductMapper.updateEntity(dto, product);
        Product saved = _productRepository.save(product);
        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse getById(Long id) {
        Product saved = _productRepository.findById(id).orElseThrow(() ->  new ResourceNotFoundException("Product not found"));
        return ProductMapper.toResponse(saved);
    }

    @Override
    public List<ProductResponse> getAll() {
        return _productRepository.findAll().stream().map(ProductMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Product product = _productRepository.findById(id).orElseThrow(() ->  new ResourceNotFoundException("Product not found"));
        _productRepository.delete(product);
    }
}
