package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Optional<ActivityLog> findByIdAndUser_Company_Id(Long id, Long companyId);

    List<ActivityLog> findAllByUser_Company_Id(Long companyId);

    List<ActivityLog> findByUserId(Long userId);

    List<ActivityLog> findByUserIdAndUser_Company_Id(Long userId, Long companyId);

    List<ActivityLog> findByActionAndUserId(String action, Long userId);

    List<ActivityLog> findByActionAndUserIdAndUser_Company_Id(String action, Long userId, Long companyId);

    List<ActivityLog> findByEntityNameAndUserId(String entityName, Long userId);

    List<ActivityLog> findByEntityNameAndUserIdAndUser_Company_Id(String entityName, Long userId, Long companyId);

    List<ActivityLog> findByCreatedAtBetweenAndUserId(LocalDateTime start, LocalDateTime end, Long userId);

    List<ActivityLog> findByCreatedAtBetweenAndUserIdAndUser_Company_Id(LocalDateTime start, LocalDateTime end, Long userId, Long companyId);

    List<ActivityLog> findByCreatedAtBeforeAndUserId(LocalDateTime date, Long userId);

    List<ActivityLog> findByCreatedAtBeforeAndUserIdAndUser_Company_Id(LocalDateTime date, Long userId, Long companyId);

    List<ActivityLog> findByCreatedAtAfterAndUserId(LocalDateTime date, Long userId);

    List<ActivityLog> findByCreatedAtAfterAndUserIdAndUser_Company_Id(LocalDateTime date, Long userId, Long companyId);
    List<ActivityLog> findTop10ByOrderByCreatedAtDesc();
}
