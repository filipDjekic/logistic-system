package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.TransportOrderItem;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

public interface TransportOrderItemRepository extends JpaRepository<TransportOrderItem, Long> {

    @Query("select coalesce(sum(i.quantity), 0) from TransportOrderItem i where i.transportOrder.destinationWarehouse.id = :warehouseId and i.transportOrder.id <> :excludedOrderId and i.transportOrder.status in :statuses")
    BigDecimal sumIncomingQuantity(@Param("warehouseId") Long warehouseId, @Param("excludedOrderId") Long excludedOrderId, @Param("statuses") java.util.Collection<rs.logistics.logistics_system.enums.TransportOrderStatus> statuses);

    @EntityGraph(attributePaths = {"product", "product.company", "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse"})
    List<TransportOrderItem> findByTransportOrderId(Long transportOrderId);

    @EntityGraph(attributePaths = {"product", "product.company", "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse"})
    Page<TransportOrderItem> findByTransportOrderId(Long transportOrderId, Pageable pageable);

    @EntityGraph(attributePaths = {"product", "product.company", "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse"})
    List<TransportOrderItem> findByTransportOrderIdAndTransportOrder_CreatedBy_Company_Id(Long transportOrderId, Long companyId);

    @EntityGraph(attributePaths = {"product", "product.company", "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse"})
    Page<TransportOrderItem> findByTransportOrderIdAndTransportOrder_CreatedBy_Company_Id(Long transportOrderId, Long companyId, Pageable pageable);

    List<TransportOrderItem> findByProductId(Long productId);

    Page<TransportOrderItem> findByProductId(Long productId, Pageable pageable);

    Page<TransportOrderItem> findByProductIdAndTransportOrder_CreatedBy_Company_Id(Long productId, Long companyId, Pageable pageable);

    List<TransportOrderItem> findAllByTransportOrder_CreatedBy_Company_Id(Long companyId);

    @EntityGraph(attributePaths = {"product", "product.company", "transportOrder", "transportOrder.sourceWarehouse", "transportOrder.destinationWarehouse"})
    Page<TransportOrderItem> findAllByTransportOrder_CreatedBy_Company_Id(Long companyId, Pageable pageable);

    Optional<TransportOrderItem> findByIdAndTransportOrder_CreatedBy_Company_Id(Long id, Long companyId);

    boolean existsByTransportOrderIdAndProductId(Long transportOrderId, Long productId);

    boolean existsByTransportOrderIdAndProductIdAndIdNot(Long transportOrderId, Long productId, Long id);
}
