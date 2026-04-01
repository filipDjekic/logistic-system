package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);

    Optional<Notification> findByUserIdAndId(Long userId, Long id);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, NotificationStatus status, Pageable pageable);

    long countByUserIdAndStatus(Long userId, NotificationStatus status);

    boolean existsByUserIdAndTitleAndMessageAndTypeAndStatus(Long userId, String title, String message, NotificationType type, NotificationStatus status);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status WHERE n.user.id = :userId AND n.status <> :status")
    void markAllAsRead(@Param("userId") Long userId, @Param("status") NotificationStatus status);
}