package rs.logistics.logistics_system.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.service.definition.ActivityRetentionServiceDefinition;

@Component
@RequiredArgsConstructor
public class ActivityRetentionScheduler {

    private final ActivityRetentionServiceDefinition activityRetentionService;

    @Scheduled(cron = "${app.retention.cleanup-cron:0 20 3 * * *}")
    public void runRetentionSweep() {
        activityRetentionService.runRetentionSweep();
    }
}
