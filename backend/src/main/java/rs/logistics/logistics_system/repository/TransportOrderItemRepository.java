package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.TransportOrderItem;

import java.util.List;
import java.util.Optional;

public interface TransportOrderItemRepository extends JpaRepository<TransportOrderItem, Long> {

    List<TransportOrderItem> findByTransportOrderId(Long transportOrderId);

    List<TransportOrderItem> findByTransportOrderIdAndTransportOrder_CreatedBy_Company_Id(Long transportOrderId, Long companyId);

    List<TransportOrderItem> findByProductId(Long productId);

    List<TransportOrderItem> findAllByTransportOrder_CreatedBy_Company_Id(Long companyId);

    Optional<TransportOrderItem> findByIdAndTransportOrder_CreatedBy_Company_Id(Long id, Long companyId);

    boolean existsByTransportOrderIdAndProductId(Long transportOrderId, Long productId);

    boolean existsByTransportOrderIdAndProductIdAndIdNot(Long transportOrderId, Long productId, Long id);
}
