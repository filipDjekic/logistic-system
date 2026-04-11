package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.util.List;
import java.util.Optional;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    Optional<Warehouse> findByIdAndCompany_Id(Long id, Long companyId);

    List<Warehouse> findAllByCompany_Id(Long companyId);

    List<Warehouse> findByManagerId(Long managerId);

    List<Warehouse> findByManagerIdAndCompany_Id(Long managerId, Long companyId);

    List<Warehouse> findByStatus(WarehouseStatus status);

    List<Warehouse> findByStatusAndCompany_Id(WarehouseStatus status, Long companyId);

    List<Warehouse> findByCityContainingIgnoreCase(String city);

    List<Warehouse> findByCityContainingIgnoreCaseAndCompany_Id(String city, Long companyId);
}
