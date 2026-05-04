package rs.logistics.logistics_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import rs.logistics.logistics_system.entity.VehicleBrand;

public interface VehicleBrandRepository extends JpaRepository<VehicleBrand, Long> {

    Optional<VehicleBrand> findByNameIgnoreCase(String name);

    List<VehicleBrand> findByActiveTrueOrderByNameAsc();
}