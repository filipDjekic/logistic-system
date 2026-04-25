package rs.logistics.logistics_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.WarehouseStatus;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    Optional<Warehouse> findByIdAndCompany_Id(Long id, Long companyId);

    List<Warehouse> findAllByCompany_Id(Long companyId);

    List<Warehouse> findByManagerId(Long managerId);

    List<Warehouse> findByManagerIdAndCompany_Id(Long managerId, Long companyId);

    List<Warehouse> findByStatus(WarehouseStatus status);

    List<Warehouse> findByStatusAndCompany_Id(WarehouseStatus status, Long companyId);

    List<Warehouse> findByCityContainingIgnoreCase(String city);

    List<Warehouse> findByCityContainingIgnoreCaseAndCompany_Id(String city, Long companyId);

    long countByCompany_Id(Long companyId);

    @Query("""
        select w
        from Warehouse w
        left join w.manager m
        left join w.company c
        where (:companyId is null or c.id = :companyId)
        and (:status is null or w.status = :status)
        and (:active is null or w.active = :active)
        and (:managerId is null or m.id = :managerId)
        and (
            :search is null
            or lower(w.name) like lower(concat('%', :search, '%'))
            or lower(w.city) like lower(concat('%', :search, '%'))
            or lower(w.address) like lower(concat('%', :search, '%'))
            or lower(coalesce(m.firstName, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(m.lastName, '')) like lower(concat('%', :search, '%'))
            or lower(coalesce(c.name, '')) like lower(concat('%', :search, '%'))
            or str(w.id) like concat('%', :search, '%')
        )
    """)
    Page<Warehouse> search(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("status") WarehouseStatus status,
            @Param("active") Boolean active,
            @Param("managerId") Long managerId,
            Pageable pageable
    );
}
