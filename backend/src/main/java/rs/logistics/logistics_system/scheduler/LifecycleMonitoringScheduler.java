package rs.logistics.logistics_system.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.service.definition.LifecycleMonitoringServiceDefinition;

@Component
@RequiredArgsConstructor
public class LifecycleMonitoringScheduler {

    private final LifecycleMonitoringServiceDefinition lifecycleMonitoringService;

    @Scheduled(fixedDelayString = "${app.lifecycle.monitoring-delay-ms:180000}", initialDelayString = "${app.lifecycle.monitoring-initial-delay-ms:60000}")
    public void runMonitoringSweep() {
        lifecycleMonitoringService.runMonitoringSweep();
    }
}
