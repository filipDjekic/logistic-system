package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    Optional<Shift> findByIdAndEmployee_Company_Id(Long id, Long companyId);

    List<Shift> findByEmployeeId(Long employeeId);

    List<Shift> findByEmployeeIdAndEmployee_Company_Id(Long employeeId, Long companyId);

    List<Shift> findByStatus(ShiftStatus status);

    List<Shift> findByStatusAndEmployee_Company_Id(ShiftStatus status, Long companyId);

    List<Shift> findAllByEmployee_Company_Id(Long companyId);

    Page<Shift> findAllByEmployee_Company_Id(Long companyId, Pageable pageable);

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.employee.id = :employeeId
            AND s.status <> rs.logistics.logistics_system.enums.ShiftStatus.CANCELLED
            AND s.startTime < :endTime
            AND s.endTime > :startTime
            """)
    List<Shift> findOverlappingShifts(@Param("employeeId") Long employeeId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.employee.id = :employeeId
            AND s.id <> :shiftId
            AND s.status <> rs.logistics.logistics_system.enums.ShiftStatus.CANCELLED
            AND s.startTime < :endTime
            AND s.endTime > :startTime
            """)
    List<Shift> findOverlappingShiftsForUpdate(@Param("employeeId") Long employeeId, @Param("shiftId") Long shiftId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.startTime < :endOfDay
            AND s.endTime > :startOfDay
            ORDER BY s.startTime ASC
            """)
    List<Shift> findShiftsForDay(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.startTime >= :startTime
            AND s.endTime <= :endTime
            """)
    List<Shift> findShiftByBetweenDates(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.startTime < :endOfDay
            AND s.endTime > :startOfDay
            AND s.employee.company.id = :companyId
            ORDER BY s.startTime ASC
            """)
    List<Shift> findShiftsForDayAndCompany(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay, @Param("companyId") Long companyId);

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.startTime >= :startTime
            AND s.endTime <= :endTime
            AND s.employee.company.id = :companyId
            """)
    List<Shift> findShiftByBetweenDatesAndCompany(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, @Param("companyId") Long companyId);

    @Query("""
            select case when count(s) > 0 then true else false end
            from Shift s
            where s.employee.id = :employeeId
            and s.status in :statuses
            and s.startTime <= :moment
            and s.endTime >= :moment
            """)
    boolean existsCoveringActiveOrPlannedShift(@Param("employeeId") Long employeeId, @Param("moment") LocalDateTime moment, @Param("statuses") java.util.Collection<ShiftStatus> statuses);

    @Query("""
            select case when count(s) > 0 then true else false end
            from Shift s
            where s.employee.id = :employeeId
            and s.status in :statuses
            and s.startTime <= :startTime
            and s.endTime >= :endTime
            """)
    boolean existsCoveringActiveOrPlannedShiftInterval(@Param("employeeId") Long employeeId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, @Param("statuses") java.util.Collection<ShiftStatus> statuses);

    @Query("""
            select s
            from Shift s
            join fetch s.employee employee
            where (:companyId is null or employee.company.id = :companyId)
            and (:employeeId is null or employee.id = :employeeId)
            and (:position is null or employee.position = :position)
            and (
                (:fromDate is null and :toDate is null)
                or (:fromDate is null and s.startTime <= :toDate)
                or (:toDate is null and s.endTime >= :fromDate)
                or (s.startTime <= :toDate and s.endTime >= :fromDate)
            )
            """)
    List<Shift> searchReportShifts(@Param("companyId") Long companyId, @Param("employeeId") Long employeeId, @Param("position") rs.logistics.logistics_system.enums.EmployeePosition position, @Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("""
            select s
            from Shift s
            join fetch s.employee employee
            left join fetch employee.user user
            where s.status = rs.logistics.logistics_system.enums.ShiftStatus.PLANNED
            and s.startTime <= :now
            """)
    List<Shift> findPlannedShiftsToActivate(@Param("now") LocalDateTime now);

    @Query("""
            select s
            from Shift s
            join fetch s.employee employee
            left join fetch employee.user user
            where s.status = rs.logistics.logistics_system.enums.ShiftStatus.ACTIVE
            and s.endTime <= :now
            """)
    List<Shift> findActiveShiftsToFinish(@Param("now") LocalDateTime now);

    @Query("""
            select count(s)
            from Shift s
            where s.employee.company.id = :companyId
            and s.status = rs.logistics.logistics_system.enums.ShiftStatus.ACTIVE
            and s.startTime <= :now
            and s.endTime > :now
            """)
    long countActiveForCompany(@Param("companyId") Long companyId, @Param("now") LocalDateTime now);

    @Query("""
            select count(s)
            from Shift s
            where s.employee.company.id = :companyId
            and s.status = rs.logistics.logistics_system.enums.ShiftStatus.PLANNED
            and s.startTime > :now
            """)
    long countPlannedForCompany(@Param("companyId") Long companyId, @Param("now") LocalDateTime now);
}
