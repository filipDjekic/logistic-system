package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> getAll();

    List<ActivityLog> findByUserId(Long userId);

    List<ActivityLog> findByAction(String action, Long userId);

    List<ActivityLog> findByEntityName(String entityName, Long userId);

    List<ActivityLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Long userId);

    List<ActivityLog> getByDateBefore(LocalDateTime date, Long userId);

    List<ActivityLog> getByDateAfter(LocalDateTime date, Long userId);

    List<ActivityLog> getByDateOnly(LocalDateTime date, Long userId);


}
