package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.TransportOrderItem;

import java.util.List;

public interface TransportOrderItemRepository extends JpaRepository<TransportOrderItem, Long> {

    List<TransportOrderItem> findByTransportOrderId(Long transportOrderId);

    List<TransportOrderItem> findByProductId(Long productId);

    boolean existsByTransportOrderIdAndProductId(Long transportOrderId, Long productId);

    boolean existsByTransportOrderIdAndProductIdAndIdNot(Long transportOrderId, Long productId, Long id);
}