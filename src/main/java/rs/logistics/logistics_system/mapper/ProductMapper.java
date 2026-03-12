package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.response.ProductResponse;
import rs.logistics.logistics_system.dto.update.ProductUpdate;
import rs.logistics.logistics_system.entity.Product;

public class ProductMapper {

    public static Product toEntity(ProductCreate dto) {
        Product product = new Product(
                dto.getName(),
                dto.getDescription(),
                dto.getSku(),
                dto.getUnit(),
                dto.getPrice(),
                dto.getFragile(),
                dto.getWeight()
        );
        return product;
    }

    public static void updateEntity(ProductUpdate dto, Product product) {
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setSku(dto.getSku());
        product.setUnit(dto.getUnit());
        product.setPrice(dto.getPrice());
        product.setFragile(dto.getFragile());
        product.setWeight(dto.getWeight());
    }

    public static ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getSku(),
                product.getUnit(),
                product.getPrice(),
                product.getFragile(),
                product.getWeight()
        );
        return response;
    }
}
