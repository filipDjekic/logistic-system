package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.DriverWorkloadResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.DriverWorkloadServiceDefinition;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverWorkloadService implements DriverWorkloadServiceDefinition {

    private static final BigDecimal MAX_DAILY_DRIVING_HOURS = BigDecimal.valueOf(9);
    private static final BigDecimal MAX_WEEKLY_DRIVING_HOURS = BigDecimal.valueOf(45);

    private static final List<TransportOrderStatus> WORKLOAD_STATUSES = List.of(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING,
            TransportOrderStatus.RESCHEDULED,
            TransportOrderStatus.DELIVERED
    );

    private final EmployeeRepository employeeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional(readOnly = true)
    public DriverWorkloadResponse getWorkload(Long employeeId, LocalDateTime from, LocalDateTime to) {
        Employee driver = getAccessibleDriver(employeeId);
        LocalDateTime effectiveFrom = from != null ? from : LocalDate.now().atStartOfDay();
        LocalDateTime effectiveTo = to != null ? to : effectiveFrom.plusDays(1);

        BigDecimal dailyHours = calculateDrivingHours(employeeId, effectiveFrom.toLocalDate().atStartOfDay(), effectiveFrom.toLocalDate().plusDays(1).atStartOfDay(), null);
        BigDecimal weeklyHours = calculateDrivingHours(employeeId, effectiveFrom.toLocalDate().minusDays(effectiveFrom.getDayOfWeek().getValue() - 1).atStartOfDay(), effectiveFrom.toLocalDate().minusDays(effectiveFrom.getDayOfWeek().getValue() - 1).plusDays(7).atStartOfDay(), null);
        BigDecimal requestedHours = hoursBetween(effectiveFrom, effectiveTo);

        BigDecimal projectedDaily = dailyHours.add(requestedHours);
        BigDecimal projectedWeekly = weeklyHours.add(requestedHours);

        return new DriverWorkloadResponse(
                driver.getId(),
                driver.getFirstName() + " " + driver.getLastName(),
                dailyHours,
                weeklyHours,
                MAX_DAILY_DRIVING_HOURS,
                MAX_WEEKLY_DRIVING_HOURS,
                projectedDaily.compareTo(MAX_DAILY_DRIVING_HOURS) > 0,
                projectedWeekly.compareTo(MAX_WEEKLY_DRIVING_HOURS) > 0,
                projectedDaily.compareTo(MAX_DAILY_DRIVING_HOURS) <= 0 && projectedWeekly.compareTo(MAX_WEEKLY_DRIVING_HOURS) <= 0
        );
    }

    @Override
    @Transactional(readOnly = true)
    public void validateDriverCanTakeTransport(Long employeeId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime, Long excludedTransportOrderId) {
        Employee driver = getAccessibleDriver(employeeId);
        if (departureTime == null || plannedArrivalTime == null || !departureTime.isBefore(plannedArrivalTime)) {
            throw new BadRequestException("Valid departure and arrival time are required for driver workload check");
        }

        BigDecimal requestedHours = hoursBetween(departureTime, plannedArrivalTime);
        LocalDate date = departureTime.toLocalDate();
        LocalDate weekStart = date.minusDays(date.getDayOfWeek().getValue() - 1);

        BigDecimal dailyHours = calculateDrivingHours(driver.getId(), date.atStartOfDay(), date.plusDays(1).atStartOfDay(), excludedTransportOrderId);
        BigDecimal weeklyHours = calculateDrivingHours(driver.getId(), weekStart.atStartOfDay(), weekStart.plusDays(7).atStartOfDay(), excludedTransportOrderId);

        if (dailyHours.add(requestedHours).compareTo(MAX_DAILY_DRIVING_HOURS) > 0) {
            throw new BadRequestException("Driver daily workload limit exceeded");
        }
        if (weeklyHours.add(requestedHours).compareTo(MAX_WEEKLY_DRIVING_HOURS) > 0) {
            throw new BadRequestException("Driver weekly workload limit exceeded");
        }
    }

    private BigDecimal calculateDrivingHours(Long employeeId, LocalDateTime from, LocalDateTime to, Long excludedTransportOrderId) {
        return transportOrderRepository.findByAssignedEmployeeIdAndDepartureTimeBetweenAndStatusIn(employeeId, from, to, WORKLOAD_STATUSES)
                .stream()
                .filter(order -> excludedTransportOrderId == null || !excludedTransportOrderId.equals(order.getId()))
                .map(this::durationHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal durationHours(TransportOrder order) {
        LocalDateTime start = order.getDepartureTime();
        LocalDateTime end = order.getActualArrivalTime() != null ? order.getActualArrivalTime() : order.getPlannedArrivalTime();
        if (start == null || end == null || !start.isBefore(end)) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(Duration.between(start, end).toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal hoursBetween(LocalDateTime from, LocalDateTime to) {
        return BigDecimal.valueOf(Duration.between(from, to).toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private Employee getAccessibleDriver(Long employeeId) {
        Employee employee = authenticatedUserProvider.isOverlord()
                ? employeeRepository.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Driver not found"))
                : employeeRepository.findByIdAndCompany_Id(employeeId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Driver not found"));
        if (employee.getPosition() != EmployeePosition.DRIVER) {
            throw new BadRequestException("Selected employee is not a driver");
        }
        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new BadRequestException("Inactive driver cannot be assigned to transport");
        }
        return employee;
    }
}
