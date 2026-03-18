package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserId(Long userId);

    List<ActivityLog> findByActionAndUserId(String action, Long userId);

    List<ActivityLog> findByEntityNameAndUserId(String entityName, Long userId);

    List<ActivityLog> findByCreatedAtBetweenAndUserId(LocalDateTime start, LocalDateTime end, Long userId);

    List<ActivityLog> findByCreatedAtBeforeAndUserId(LocalDateTime date, Long userId);

    List<ActivityLog> findByCreatedAtAfterAndUserId(LocalDateTime date, Long userId);


}
