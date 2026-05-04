package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.VehicleModel;

import java.util.List;
import java.util.Optional;

public interface VehicleModelRepository extends JpaRepository<VehicleModel, Long> {

    Optional<VehicleModel> findByBrand_IdAndNameIgnoreCase(Long brandId, String name);

    List<VehicleModel> findByBrand_IdAndActiveTrueOrderByNameAsc(Long brandId);
}