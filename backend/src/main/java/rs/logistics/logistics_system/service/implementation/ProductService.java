package rs.logistics.logistics_system.service.implementation;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.ProductResponse;
import rs.logistics.logistics_system.dto.update.ProductUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ProductMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.ProductServiceDefinition;

@Service
@RequiredArgsConstructor
public class ProductService implements ProductServiceDefinition {

    private final ProductRepository _productRepository;
    private final CompanyRepository companyRepository;
    private final AuditFacadeDefinition auditFacade;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional
    public ProductResponse create(ProductCreate dto) {
        Company targetCompany = resolveTargetCompany(dto.getCompanyId());
        validateSkuForCreate(dto.getSku(), targetCompany.getId());

        Product product = ProductMapper.toEntity(dto);
        product.setCompany(targetCompany);

        Product saved = _productRepository.save(product);

        auditFacade.recordCreate("PRODUCT", saved.getId());
        auditFacade.recordFieldChange("PRODUCT", saved.getId(), "company_id", null, saved.getCompany() != null ? saved.getCompany().getId() : null);
        auditFacade.log(
                "CREATE",
                "PRODUCT",
                saved.getId(),
                "PRODUCT is created (ID: " + saved.getId() + ", companyId: " + (saved.getCompany() != null ? saved.getCompany().getId() : null) + ")"
        );

        return ProductMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, ProductUpdate dto) {
        Product product = getProductOrThrow(id);

        validateSkuForUpdate(dto.getSku(), id, product.getCompany() != null ? product.getCompany().getId() : null);

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
    public PageResponse<ProductResponse> getAll(String search, Boolean active, Pageable pageable) {
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Page<Product> page = _productRepository.searchProducts(companyId, QueryParameterNormalizer.trimToNull(search), active, pageable);
        List<ProductResponse> content = page.getContent()
                .stream()
                .map(ProductMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.fromContent(content, page);
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
    @Transactional
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
    @Transactional
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

    private String normalizeSearch(String search) {
        if (search == null || search.trim().isEmpty()) {
            return null;
        }
        return search.trim();
    }

    private Product getProductOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        }

        return _productRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private Company resolveTargetCompany(Long companyId) {
        if (authenticatedUserProvider.isOverlord()) {
            if (companyId == null) {
                throw new BadRequestException("companyId is required for OVERLORD product creation");
            }

            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
            validateTargetCompany(company);
            return company;
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompanyOrThrow();
        validateTargetCompany(company);
        return company;
    }

    private void validateTargetCompany(Company company) {
        if (company == null || company.getId() == null) {
            throw new BadRequestException("Product must belong to a company");
        }

        if (!Boolean.TRUE.equals(company.getActive())) {
            throw new BadRequestException("Product cannot be created for an inactive company");
        }
    }

    private void validateSkuForCreate(String sku, Long companyId) {
        if (_productRepository.existsBySkuAndCompany_Id(sku, companyId)) {
            throw new BadRequestException("Product SKU already exists in this company");
        }
    }

    private void validateSkuForUpdate(String sku, Long id, Long companyId) {
        if (_productRepository.existsBySkuAndCompany_IdAndIdNot(sku, companyId, id)) {
            throw new BadRequestException("Product SKU already exists in this company");
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
