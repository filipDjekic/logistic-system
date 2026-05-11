package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.response.DriverWorkloadResponse;

import java.time.LocalDateTime;

public interface DriverWorkloadServiceDefinition {
    DriverWorkloadResponse getWorkload(Long employeeId, LocalDateTime from, LocalDateTime to);
    void validateDriverCanTakeTransport(Long employeeId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime, Long excludedTransportOrderId);
}
