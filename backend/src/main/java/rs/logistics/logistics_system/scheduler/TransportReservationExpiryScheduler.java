package rs.logistics.logistics_system.scheduler;

import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.implementation.transport.TransportReservationExpiryWorker;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransportReservationExpiryScheduler {
    private final TransportOrderRepository orderRepository;
    private final TransportReservationExpiryWorker worker;
    private final TimeServiceDefinition timeService;

    @Scheduled(fixedDelayString = "${logistics.transport.reservation-cleanup-delay:5m}")
    public void releaseExpiredDraftReservations() {
        var now = timeService.nowSystem();
        var ids = orderRepository.findExpiredDraftReservationIds(now, PageRequest.of(0, 100));
        ids.forEach(id -> {
            try {
                worker.expire(id, now);
            } catch (RuntimeException ex) {
                log.warn("Could not expire transport reservation for order {}", id, ex);
            }
        });
    }
}
