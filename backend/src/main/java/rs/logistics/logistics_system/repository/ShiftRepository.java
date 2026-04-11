package rs.logistics.logistics_system.repository;

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

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.employee.id = :employeeId
            AND s.startTime < :endTime
            AND s.endTime > :startTime
            """)
    List<Shift> findOverlappingShifts(@Param("employeeId") Long employeeId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("""
            SELECT s
            FROM Shift s
            WHERE s.employee.id = :employeeId
            AND s.id <> :shiftId
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
    List<Shift> findShiftsForDayAndCompany(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("companyId") Long companyId
    );

    @Query("""
        SELECT s
        FROM Shift s
        WHERE s.startTime >= :startTime
        AND s.endTime <= :endTime
        AND s.employee.company.id = :companyId
        """)
    List<Shift> findShiftByBetweenDatesAndCompany(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("companyId") Long companyId
    );
}