package rs.logistics.logistics_system.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;

@Component
@RequiredArgsConstructor
public class ShiftLifecycleScheduler {

    private final ShiftServiceDefinition shiftService;

    @Scheduled(fixedDelayString = "${app.lifecycle.shift-status-delay-ms:60000}", initialDelayString = "${app.lifecycle.shift-status-initial-delay-ms:30000}")
    public void synchronizeShiftStatuses() {
        shiftService.synchronizeShiftStatuses();
    }
}
