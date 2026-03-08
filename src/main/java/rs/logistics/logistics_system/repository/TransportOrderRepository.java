package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransportOrderRepository extends JpaRepository<TransportOrder, Long> {

    Optional<TransportOrder> findByOrderNumber(String orderNumber);

    List<TransportOrder> findByStatus(TransportOrderStatus status);

    List<TransportOrder> findByVehicleId(Long vehicleId);

    List<TransportOrder> findByAssignedEmployeeId(Long assignedEmployeeId);

    List<TransportOrder> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
