package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.service.definition.ActivityRetentionServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ActivityRetentionService implements ActivityRetentionServiceDefinition {

    private final ActivityLogRepository activityLogRepository;
    private final ChangeHistoryRepository changeHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final TimeServiceDefinition timeService;

    @Value("${app.retention.activity-log-days:365}")
    private long activityLogRetentionDays;

    @Value("${app.retention.change-history-days:730}")
    private long changeHistoryRetentionDays;

    @Value("${app.retention.read-notification-days:90}")
    private long readNotificationRetentionDays;

    @Override
    @Transactional
    public void runRetentionSweep() {
        LocalDateTime now = timeService.nowSystem();
        activityLogRepository.deleteOlderThan(now.minusDays(activityLogRetentionDays));
        changeHistoryRepository.deleteOlderThan(now.minusDays(changeHistoryRetentionDays));
        notificationRepository.deleteByStatusAndCreatedAtBefore(NotificationStatus.READ, now.minusDays(readNotificationRetentionDays));
    }
}
