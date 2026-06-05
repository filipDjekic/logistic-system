package rs.logistics.logistics_system.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.WarehouseStatus;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    Optional<Warehouse> findByIdAndCompany_Id(Long id, Long companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Warehouse w where w.id = :id")
    Optional<Warehouse> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Warehouse w where w.id = :id and w.company.id = :companyId")
    Optional<Warehouse> findByIdAndCompanyIdForUpdate(@Param("id") Long id, @Param("companyId") Long companyId);

    List<Warehouse> findAllByCompany_Id(Long companyId);

    List<Warehouse> findByManagerId(Long managerId);

    List<Warehouse> findByManagerIdAndCompany_Id(Long managerId, Long companyId);

    List<Warehouse> findByStatus(WarehouseStatus status);

    List<Warehouse> findByStatusAndCompany_Id(WarehouseStatus status, Long companyId);

    List<Warehouse> findByCity_NameContainingIgnoreCase(String city);

    List<Warehouse> findByCity_NameContainingIgnoreCaseAndCompany_Id(String city, Long companyId);

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
            or lower(w.city.name) like lower(concat('%', :search, '%'))
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

    @Query("""
        select distinct w
        from Warehouse w
        join EmployeeWarehouseAssignment a on a.warehouse = w
        where (:companyId is null or w.company.id = :companyId)
        and a.employee.id = :employeeId
        and a.active = true
        and (:status is null or w.status = :status)
        and (:active is null or w.active = :active)
        and (:managerId is null or w.manager.id = :managerId)
        and (
            :search is null
            or lower(w.name) like lower(concat('%', :search, '%'))
            or lower(w.city.name) like lower(concat('%', :search, '%'))
            or lower(w.address) like lower(concat('%', :search, '%'))
            or str(w.id) like concat('%', :search, '%')
        )
    """)
    Page<Warehouse> searchAssignedWarehouses(
            @Param("companyId") Long companyId,
            @Param("employeeId") Long employeeId,
            @Param("search") String search,
            @Param("status") WarehouseStatus status,
            @Param("active") Boolean active,
            @Param("managerId") Long managerId,
            Pageable pageable
    );


    @Query("""
        select w.id, w.name, w.capacity, coalesce(sum(wi.quantity), 0), count(wi)
        from Warehouse w
        left join WarehouseInventory wi on wi.warehouse = w
        where (:companyId is null or w.company.id = :companyId)
        and (:restrictWarehouseIds = false or w.id in :warehouseIds)
        group by w.id, w.name, w.capacity
        order by coalesce(sum(wi.quantity), 0) desc
    """)
    List<Object[]> findWarehouseCongestionRows(
            @Param("companyId") Long companyId,
            @Param("warehouseIds") java.util.Collection<Long> warehouseIds,
            @Param("restrictWarehouseIds") boolean restrictWarehouseIds
    );

}
