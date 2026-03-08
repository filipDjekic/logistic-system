package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    List<Shift> findByEmployeeId(Long employeeId);

    List<Shift> findByStatus(ShiftStatus status);

    // smene u periodu od do
    List<Shift> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
