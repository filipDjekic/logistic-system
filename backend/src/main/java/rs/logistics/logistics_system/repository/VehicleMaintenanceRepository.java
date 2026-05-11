package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.VehicleMaintenance;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface VehicleMaintenanceRepository extends JpaRepository<VehicleMaintenance, Long> {

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, Collection<VehicleMaintenanceStatus> statuses);

    boolean existsByVehicleIdAndStatusInAndIdNot(Long vehicleId, Collection<VehicleMaintenanceStatus> statuses, Long id);

    @Query("""
        select count(vm) > 0
        from VehicleMaintenance vm
        where vm.vehicle.id = :vehicleId
        and vm.status in :statuses
        and vm.scheduledAt < :endAt
    """)
    boolean existsActiveMaintenanceBeforeEnd(
            @Param("vehicleId") Long vehicleId,
            @Param("statuses") Collection<VehicleMaintenanceStatus> statuses,
            @Param("endAt") LocalDateTime endAt
    );

    @Query("""
        select vm
        from VehicleMaintenance vm
        where (:companyId is null or vm.company.id = :companyId)
        and (:vehicleId is null or vm.vehicle.id = :vehicleId)
        and (:status is null or vm.status = :status)
        order by vm.scheduledAt desc, vm.id desc
    """)
    Page<VehicleMaintenance> search(
            @Param("companyId") Long companyId,
            @Param("vehicleId") Long vehicleId,
            @Param("status") VehicleMaintenanceStatus status,
            Pageable pageable
    );

    List<VehicleMaintenance> findByVehicleIdOrderByScheduledAtDesc(Long vehicleId);
}
