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

    Page<VehicleMaintenance> findByCompany_Id(Long companyId, Pageable pageable);

    Page<VehicleMaintenance> findByCompany_IdAndVehicle_Id(Long companyId, Long vehicleId, Pageable pageable);

    Page<VehicleMaintenance> findByCompany_IdAndStatus(Long companyId, VehicleMaintenanceStatus status, Pageable pageable);

    Page<VehicleMaintenance> findByCompany_IdAndVehicle_IdAndStatus(Long companyId, Long vehicleId, VehicleMaintenanceStatus status, Pageable pageable);

    Page<VehicleMaintenance> findByVehicle_Id(Long vehicleId, Pageable pageable);

    Page<VehicleMaintenance> findByStatus(VehicleMaintenanceStatus status, Pageable pageable);

    Page<VehicleMaintenance> findByVehicle_IdAndStatus(Long vehicleId, VehicleMaintenanceStatus status, Pageable pageable);

    List<VehicleMaintenance> findByVehicleIdOrderByScheduledAtDesc(Long vehicleId);

    @Query("""
        select vm
        from VehicleMaintenance vm
        where vm.vehicle.id in (
            select distinct t.vehicle.id
            from TransportOrder t
            where t.assignedEmployee.user.id = :driverUserId
            and t.vehicle is not null
        )
        and (:vehicleId is null or vm.vehicle.id = :vehicleId)
        and (:status is null or vm.status = :status)
    """)
    Page<VehicleMaintenance> findForDriverRelatedVehicles(
            @Param("driverUserId") Long driverUserId,
            @Param("vehicleId") Long vehicleId,
            @Param("status") VehicleMaintenanceStatus status,
            Pageable pageable
    );

    @Query("""
        select count(vm) > 0
        from VehicleMaintenance vm
        where vm.id = :maintenanceId
        and vm.vehicle.id in (
            select distinct t.vehicle.id
            from TransportOrder t
            where t.assignedEmployee.user.id = :driverUserId
            and t.vehicle is not null
        )
    """)
    boolean existsForDriverRelatedVehicle(@Param("maintenanceId") Long maintenanceId, @Param("driverUserId") Long driverUserId);

}
