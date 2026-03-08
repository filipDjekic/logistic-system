package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserId(Long userId);

    List<ActivityLog> findByEntityName(String entityName);

    List<ActivityLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
