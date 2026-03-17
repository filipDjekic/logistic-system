package rs.logistics.logistics_system.repository;

import org.aspectj.weaver.ast.Not;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.enums.NotificationStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);

    Notification findByUserIdAndId(Long userId, Long id);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status WHERE n.user.id = :userId")
    void markAllAsRead(@Param("userId") Long userId, @Param("status") NotificationStatus status);
}
