package rs.logistics.logistics_system.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.enums.EmployeePosition;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByJmbg(String jmbg);

    boolean existsByJmbgAndIdNot(String jmbg, Long id);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByUser_Id(Long userId);

    boolean existsByUser_IdAndIdNot(Long userId, Long id);

    Optional<Employee> findByUser_Id(Long userId);

    Optional<Employee> findByIdAndCompany_Id(Long id, Long companyId);

    List<Employee> findAllByCompany_Id(Long companyId);

    List<Employee> findByActive(Boolean active);

    List<Employee> findByActiveAndCompany_Id(Boolean active, Long companyId);

    List<Employee> findByPosition(EmployeePosition position);

    List<Employee> findByPositionAndCompany_Id(EmployeePosition position, Long companyId);

    List<Employee> findByLastNameContainingIgnoreCase(String lastName);

    List<Employee> findByLastNameContainingIgnoreCaseAndCompany_Id(String lastName, Long companyId);

    long countByActiveTrue();

    long countByCompany_Id(Long companyId);

    long countByCompany_IdAndActiveTrue(Long companyId);

    long countByCompany_IdAndActiveFalse(Long companyId);

    long countByCompany_IdAndEmploymentDateGreaterThanEqual(Long companyId, LocalDate employmentDate);

    @Query("select e.position, count(e) from Employee e where e.company.id = :companyId group by e.position")
    List<Object[]> countGroupedByPositionAndCompany(@Param("companyId") Long companyId);

    @Query("""
            select e
            from Employee e
            left join e.user u
            left join u.role r
            where (:companyId is null or e.company.id = :companyId)
            and (:position is null or e.position = :position)
            and (:active is null or e.active = :active)
            and (
                :linkedUser is null
                or (:linkedUser = 'LINKED' and e.user is not null)
                or (:linkedUser = 'UNLINKED' and e.user is null)
            )
            and (
                :search is null
                or lower(e.firstName) like lower(concat('%', :search, '%'))
                or lower(e.lastName) like lower(concat('%', :search, '%'))
                or lower(e.email) like lower(concat('%', :search, '%'))
                or lower(e.jmbg) like lower(concat('%', :search, '%'))
                or lower(e.phoneNumber) like lower(concat('%', :search, '%'))
                or lower(str(e.id)) like lower(concat('%', :search, '%'))
                or lower(str(e.user.id)) like lower(concat('%', :search, '%'))
                or lower(str(e.position)) like lower(concat('%', :search, '%'))
                or lower(str(u.status)) like lower(concat('%', :search, '%'))
                or lower(r.name) like lower(concat('%', :search, '%'))
            )
            """)
    Page<Employee> searchEmployees(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("position") EmployeePosition position,
            @Param("active") Boolean active,
            @Param("linkedUser") String linkedUser,
            Pageable pageable
    );

    @Query("""
            select count(e)
            from Employee e
            where e.company.id = :companyId
            and e.active = true
            and not exists (
                select 1
                from Shift s
                where s.employee = e
                and s.status in (rs.logistics.logistics_system.enums.ShiftStatus.PLANNED, rs.logistics.logistics_system.enums.ShiftStatus.ACTIVE)
                and s.endTime > :now
            )
            """)
    long countActiveEmployeesWithoutActiveOrPlannedShift(@Param("companyId") Long companyId, @Param("now") LocalDateTime now);
}
