package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Product;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByActive(Boolean active);

    List<Product> findByNameContainingIgnoreCase(String name);
}
