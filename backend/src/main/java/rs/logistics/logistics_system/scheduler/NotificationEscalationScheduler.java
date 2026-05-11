package rs.logistics.logistics_system.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.service.definition.NotificationEscalationServiceDefinition;

@Component
@RequiredArgsConstructor
public class NotificationEscalationScheduler {

    private final NotificationEscalationServiceDefinition notificationEscalationService;

    @Scheduled(fixedDelayString = "${app.lifecycle.notification-escalation-delay-ms:120000}", initialDelayString = "${app.lifecycle.notification-escalation-initial-delay-ms:45000}")
    public void runEscalationSweep() {
        notificationEscalationService.runEscalationSweep();
    }
}
