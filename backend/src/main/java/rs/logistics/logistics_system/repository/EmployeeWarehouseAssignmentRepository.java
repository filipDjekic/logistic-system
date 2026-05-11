package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.EmployeeWarehouseAssignment;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EmployeeWarehouseAssignmentRepository extends JpaRepository<EmployeeWarehouseAssignment, Long> {
    Optional<EmployeeWarehouseAssignment> findByIdAndCompany_Id(Long id, Long companyId);
    Optional<EmployeeWarehouseAssignment> findByEmployee_IdAndWarehouse_Id(Long employeeId, Long warehouseId);
    List<EmployeeWarehouseAssignment> findByEmployee_IdOrderByWarehouse_NameAsc(Long employeeId);
    List<EmployeeWarehouseAssignment> findByEmployee_IdAndCompany_IdOrderByWarehouse_NameAsc(Long employeeId, Long companyId);
    @Query("""
        select a from EmployeeWarehouseAssignment a
        join a.employee e
        where a.warehouse.id = :warehouseId
        order by e.lastName asc, e.firstName asc
    """)
    List<EmployeeWarehouseAssignment> findByWarehouseOrdered(@Param("warehouseId") Long warehouseId);

    @Query("""
        select a from EmployeeWarehouseAssignment a
        join a.employee e
        where a.warehouse.id = :warehouseId
        and a.company.id = :companyId
        order by e.lastName asc, e.firstName asc
    """)
    List<EmployeeWarehouseAssignment> findByWarehouseAndCompanyOrdered(@Param("warehouseId") Long warehouseId, @Param("companyId") Long companyId);
    boolean existsByEmployee_IdAndWarehouse_IdAndActiveTrue(Long employeeId, Long warehouseId);

    @Query("""
        select count(a) > 0
        from EmployeeWarehouseAssignment a
        where a.employee.id = :employeeId
        and a.warehouse.id = :warehouseId
        and a.active = true
        and a.accessType in :accessTypes
        and (:today is null or a.validFrom is null or a.validFrom <= :today)
        and (:today is null or a.validTo is null or a.validTo >= :today)
    """)
    boolean hasActiveAccess(
            @Param("employeeId") Long employeeId,
            @Param("warehouseId") Long warehouseId,
            @Param("accessTypes") Collection<EmployeeWarehouseAccessType> accessTypes,
            @Param("today") LocalDate today
    );
}
