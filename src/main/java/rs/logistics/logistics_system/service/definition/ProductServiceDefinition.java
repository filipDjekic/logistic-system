package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.response.ProductResponse;
import rs.logistics.logistics_system.dto.update.ProductUpdate;

import java.util.List;

public interface ProductServiceDefinition {

    ProductResponse create(ProductCreate dto);

    ProductResponse update(Long id, ProductUpdate dto);

    ProductResponse getById(Long id);

    List<ProductResponse> getAll();

    void delete(Long id);
}
