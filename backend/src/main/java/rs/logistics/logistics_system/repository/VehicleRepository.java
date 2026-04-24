package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.VehicleStatus;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    Optional<Vehicle> findByIdAndCompany_Id(Long id, Long companyId);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCaseAndIdNot(String registrationNumber, Long id);

    List<Vehicle> findAllByCompany_Id(Long companyId);

    List<Vehicle> findByStatus(VehicleStatus status);

    List<Vehicle> findByStatusAndCompany_Id(VehicleStatus status, Long companyId);

    List<Vehicle> findByActive(Boolean active);

    List<Vehicle> findByActiveAndCompany_Id(Boolean active, Long companyId);

    @Query("select v.status, count(v) from Vehicle v group by v.status")
    List<Object[]> countGroupedByStatus();
}
