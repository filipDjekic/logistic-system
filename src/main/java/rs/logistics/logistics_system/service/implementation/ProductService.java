package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.response.ProductResponse;
import rs.logistics.logistics_system.dto.update.ProductUpdate;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ProductMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ProductServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService implements ProductServiceDefinition {

    private final ProductRepository _productRepository;

    private final ActivityLogService activityLogService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public ProductResponse create(ProductCreate dto) {
        validateSkuForCreate(dto.getSku());

        Product product = ProductMapper.toEntity(dto);
        Product saved = _productRepository.save(product);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is created (ID: " + saved.getId() + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse update(Long id, ProductUpdate dto) {
        Product product = _productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        validateSkuForUpdate(dto.getSku(), id);

        ProductMapper.updateEntity(dto, product);
        Product saved = _productRepository.save(product);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is updated (ID: " + saved.getId() + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse getById(Long id) {
        Product saved = _productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return ProductMapper.toResponse(saved);
    }

    @Override
    public List<ProductResponse> getAll() {
        return _productRepository.findAll().stream().map(ProductMapper::toResponse).collect(Collectors.toList());
    }


    @Override
    public void delete(Long id) {
        Product product = _productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        validateForDeleteOrDeactivate(product);

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "PRODUCT",
                id,
                "PRODUCT is deleted (ID: " + id + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        _productRepository.delete(product);
    }

    @Override
    public ProductResponse activateProduct(Long id) {
        Product product = _productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (Boolean.TRUE.equals(product.getActive())) {
            throw new BadRequestException("Product is already active");
        }

        product.setActive(true);
        Product saved = _productRepository.save(product);

        activityLogService.create(new ActivityLogCreate(
                "ACTIVATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is activated (ID: " + saved.getId() + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse deactivateProduct(Long id) {
        Product product = _productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (Boolean.FALSE.equals(product.getActive())) {
            throw new BadRequestException("Product is already inactive");
        }

        validateForDeleteOrDeactivate(product);

        product.setActive(false);
        Product saved = _productRepository.save(product);

        activityLogService.create(new ActivityLogCreate(
                "DEACTIVATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is deactivated (ID: " + saved.getId() + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return ProductMapper.toResponse(saved);
    }
    // helpers

    private void validateSkuForCreate(String sku) {
        if (_productRepository.existsBySku(sku)) {
            throw new BadRequestException("Product SKU already exists");
        }
    }

    private void validateSkuForUpdate(String sku, Long id) {
        if (_productRepository.existsBySkuAndIdNot(sku, id)) {
            throw new BadRequestException("Product SKU already exists");
        }
    }

    private void validateForDeleteOrDeactivate(Product product) {
        if (_productRepository.existsInventoryByProductId(product.getId())) {
            throw new BadRequestException("Product is in inventory");
        }
        if (_productRepository.existsStockMovementByProductId(product.getId())) {
            throw new BadRequestException("Product is in stock");
        }
        if (_productRepository.existsTransportOrderItemByProductId(product.getId())) {
            throw new BadRequestException("Product is in transport");
        }
    }
}