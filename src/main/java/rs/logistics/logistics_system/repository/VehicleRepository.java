package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    List<Vehicle> findByStatus(VehicleStatus status);

    List<Vehicle> findByActive(Boolean active);
}
