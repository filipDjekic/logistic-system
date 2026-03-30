package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    List<Warehouse> findByManagerId(Long managerId);

    List<Warehouse> findByStatus(WarehouseStatus status);

    List<Warehouse> findByCityContainingIgnoreCase(String city);
}
