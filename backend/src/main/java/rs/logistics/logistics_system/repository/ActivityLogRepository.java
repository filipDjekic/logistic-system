package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Optional<ActivityLog> findByIdAndUser_Company_Id(Long id, Long companyId);

    @Query("""
            select a from ActivityLog a
            where (:companyId is null or a.user.company.id = :companyId)
              and (:search is null or :search = ''
                   or lower(a.action) like lower(concat('%', :search, '%'))
                   or lower(a.entityName) like lower(concat('%', :search, '%'))
                   or lower(coalesce(a.description, '')) like lower(concat('%', :search, '%')))
              and (:action is null or :action = '' or lower(a.action) like lower(concat('%', :action, '%')))
              and (:entityName is null or :entityName = '' or lower(a.entityName) like lower(concat('%', :entityName, '%')))
              and (:userId is null or a.user.id = :userId)
            """)
    Page<ActivityLog> searchLogs(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("action") String action,
            @Param("entityName") String entityName,
            @Param("userId") Long userId,
            Pageable pageable
    );

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

    long countByUser_Company_Id(Long companyId);

    List<ActivityLog> findTop10ByUser_Company_IdOrderByCreatedAtDesc(Long companyId);
}
