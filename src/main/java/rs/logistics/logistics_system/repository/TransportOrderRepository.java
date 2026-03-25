package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TransportOrderRepository extends JpaRepository<TransportOrder, Long> {

    Optional<TransportOrder> findByOrderNumber(String orderNumber);

    List<TransportOrder> findByStatus(TransportOrderStatus status);

    List<TransportOrder> findByVehicleId(Long vehicleId);

    List<TransportOrder> findByAssignedEmployeeId(Long assignedEmployeeId);

    List<TransportOrder> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, List<TransportOrderStatus> status);

    boolean existsByAssignedEmployeeIdAndStatusIn(Long assignedEmployeeId, List<TransportOrderStatus> status);

    boolean existsByVehicleIdAndStatusInAndIdNot(Long vehicleId, List<TransportOrderStatus> status, Long id);

    boolean existsByAssignedEmployeeIdAndStatusInAndIdNot(Long employeeId, List<TransportOrderStatus> statuses, Long id);

    List<TransportOrder> findBySourceWarehouseId(Long warehouseId);

    List<TransportOrder> findByDestinationWarehouseId(Long warehouseId);

    boolean existsByVehicleIdAndStatusInAndDepartureTimeLessThanAndPlannedArrivalTimeGreaterThan(Long vehicleId, List<TransportOrderStatus> statuses, LocalDateTime newEnd, LocalDateTime newStart);

    boolean existsByVehicleIdAndStatusInAndDepartureTimeLessThanAndPlannedArrivalTimeGreaterThanAndIdNot(Long vehicleId, List<TransportOrderStatus> statuses, LocalDateTime newEnd, LocalDateTime newStart, Long id);

    boolean existsByAssignedEmployeeIdAndStatusInAndDepartureTimeLessThanAndPlannedArrivalTimeGreaterThan(Long employeeId, List<TransportOrderStatus> statuses, LocalDateTime newEnd, LocalDateTime newStart);

    boolean existsByAssignedEmployeeIdAndStatusInAndDepartureTimeLessThanAndPlannedArrivalTimeGreaterThanAndIdNot(Long employeeId, List<TransportOrderStatus> statuses, LocalDateTime newEnd, LocalDateTime newStart, Long id);
}
