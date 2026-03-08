package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.enums.NotificationStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);
}
