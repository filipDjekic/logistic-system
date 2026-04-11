package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.Product;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    Optional<Product> findByIdAndCompany_Id(Long id, Long companyId);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    boolean existsBySkuAndCompany_Id(String sku, Long companyId);

    boolean existsBySkuAndCompany_IdAndIdNot(String sku, Long companyId, Long id);

    List<Product> findAllByCompany_Id(Long companyId);

    @Query("""
            select case when count(wi) > 0 then true else false end
            from WarehouseInventory wi
            where wi.product.id = :productId
            """)
    boolean existsInventoryByProductId(@Param("productId") Long productId);

    @Query("""
            select case when count(sm) > 0 then true else false end
            from StockMovement sm
            where sm.product.id = :productId
            """)
    boolean existsStockMovementByProductId(@Param("productId") Long productId);

    @Query("""
            select case when count(toi) > 0 then true else false end
            from TransportOrderItem toi
            where toi.product.id = :productId
            """)
    boolean existsTransportOrderItemByProductId(@Param("productId") Long productId);
}