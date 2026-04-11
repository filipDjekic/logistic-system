package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.response.ProductResponse;
import rs.logistics.logistics_system.dto.update.ProductUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ProductMapper;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.ProductServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService implements ProductServiceDefinition {

    private final ProductRepository _productRepository;
    private final AuditFacadeDefinition auditFacade;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public ProductResponse create(ProductCreate dto) {
        validateSkuForCreate(dto.getSku());

        Product product = ProductMapper.toEntity(dto);

        if (!authenticatedUserProvider.isOverlord()) {
            Company company = authenticatedUserProvider.getAuthenticatedCompany();
            if (company == null) {
                throw new ForbiddenException("Authenticated user is not assigned to a company");
            }
            product.setCompany(company);
        }

        Product saved = _productRepository.save(product);

        auditFacade.recordCreate("PRODUCT", saved.getId());
        auditFacade.log(
                "CREATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is created (ID: " + saved.getId() + ")"
        );

        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse update(Long id, ProductUpdate dto) {
        Product product = getProductOrThrow(id);

        validateSkuForUpdate(dto.getSku(), id);

        String oldName = product.getName();
        String oldDescription = product.getDescription();
        String oldSku = product.getSku();

        ProductMapper.updateEntity(dto, product);
        Product saved = _productRepository.save(product);

        auditFacade.recordFieldChange("PRODUCT", saved.getId(), "name", oldName, saved.getName());
        auditFacade.recordFieldChange("PRODUCT", saved.getId(), "description", oldDescription, saved.getDescription());
        auditFacade.recordFieldChange("PRODUCT", saved.getId(), "sku", oldSku, saved.getSku());

        auditFacade.log(
                "UPDATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is updated (ID: " + saved.getId() + ")"
        );

        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse getById(Long id) {
        return ProductMapper.toResponse(getProductOrThrow(id));
    }

    @Override
    public List<ProductResponse> getAll() {
        List<Product> products = authenticatedUserProvider.isOverlord()
                ? _productRepository.findAll()
                : _productRepository.findAllByCompany_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return products.stream().map(ProductMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Product product = getProductOrThrow(id);

        validateForDelete(product);

        _productRepository.delete(product);

        auditFacade.recordDelete("PRODUCT", id);
        auditFacade.log(
                "DELETE",
                "PRODUCT",
                id,
                "PRODUCT is deleted (ID: " + id + ")"
        );
    }

    @Override
    public ProductResponse activateProduct(Long id) {
        Product product = getProductOrThrow(id);

        if (Boolean.TRUE.equals(product.getActive())) {
            throw new BadRequestException("Product is already active");
        }

        product.setActive(true);
        Product saved = _productRepository.save(product);

        auditFacade.recordStatusChange("PRODUCT", saved.getId(), "active", false, true);
        auditFacade.log(
                "ACTIVATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is activated (ID: " + saved.getId() + ")"
        );

        return ProductMapper.toResponse(saved);
    }

    @Override
    public ProductResponse deactivateProduct(Long id) {
        Product product = getProductOrThrow(id);

        if (Boolean.FALSE.equals(product.getActive())) {
            throw new BadRequestException("Product is already inactive");
        }

        product.setActive(false);
        Product saved = _productRepository.save(product);

        auditFacade.recordStatusChange("PRODUCT", saved.getId(), "active", true, false);
        auditFacade.log(
                "DEACTIVATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is deactivated (ID: " + saved.getId() + ")"
        );

        return ProductMapper.toResponse(saved);
    }

    private Product getProductOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        }

        return _productRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private void validateSkuForCreate(String sku) {
        if (authenticatedUserProvider.isOverlord()) {
            if (_productRepository.existsBySku(sku)) {
                throw new BadRequestException("Product SKU already exists");
            }
            return;
        }

        if (_productRepository.existsBySkuAndCompany_Id(sku, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())) {
            throw new BadRequestException("Product SKU already exists");
        }
    }

    private void validateSkuForUpdate(String sku, Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            if (_productRepository.existsBySkuAndIdNot(sku, id)) {
                throw new BadRequestException("Product SKU already exists");
            }
            return;
        }

        if (_productRepository.existsBySkuAndCompany_IdAndIdNot(
                sku,
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(),
                id
        )) {
            throw new BadRequestException("Product SKU already exists");
        }
    }

    private void validateForDelete(Product product) {
        if (_productRepository.existsInventoryByProductId(product.getId())) {
            throw new BadRequestException("Product cannot be deleted because it exists in inventory history. Deactivate product instead.");
        }
        if (_productRepository.existsStockMovementByProductId(product.getId())) {
            throw new BadRequestException("Product cannot be deleted because it has stock movement history. Deactivate product instead.");
        }
        if (_productRepository.existsTransportOrderItemByProductId(product.getId())) {
            throw new BadRequestException("Product cannot be deleted because it is linked to transport history. Deactivate product instead.");
        }
    }
}