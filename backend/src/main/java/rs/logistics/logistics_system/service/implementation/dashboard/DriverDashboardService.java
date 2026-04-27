package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.dashboard.DriverDashboardResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.dashboard.DriverDashboardServiceDefinition;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverDashboardService implements DriverDashboardServiceDefinition {

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = List.of(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.IN_TRANSIT
    );

    private static final List<TaskStatus> OPEN_TASK_STATUSES = List.of(
            TaskStatus.NEW,
            TaskStatus.IN_PROGRESS
    );

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    public DriverDashboardResponse getOverview() {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Employee driver = employeeRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user is not linked to an employee"));

        if (driver.getPosition() != EmployeePosition.DRIVER) {
            throw new ForbiddenException("Only drivers can access driver dashboard");
        }

        List<TransportOrder> assignedTransportOrders = transportOrderRepository
                .findByAssignedEmployeeIdAndCreatedBy_Company_Id(driver.getId(), companyId);
        List<Task> assignedTasks = taskRepository
                .findByAssignedEmployeeIdAndAssignedEmployee_Company_Id(driver.getId(), companyId);

        List<TransportOrder> activeTransportOrders = assignedTransportOrders.stream()
                .filter(order -> ACTIVE_TRANSPORT_STATUSES.contains(order.getStatus()))
                .sorted(nextTransportComparator())
                .toList();

        List<Task> transportTasks = assignedTasks.stream()
                .filter(task -> task.getTransportOrder() != null)
                .sorted(Comparator.comparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        DriverDashboardResponse.DriverTransportOrderResponse nextTransportOrder = activeTransportOrders.stream()
                .findFirst()
                .map(this::mapTransportOrder)
                .orElse(null);

        return new DriverDashboardResponse(
                activeTransportOrders.size(),
                assignedTransportOrders.size(),
                countTransportOrdersByStatus(assignedTransportOrders),
                transportTasks.size(),
                transportTasks.stream().filter(task -> OPEN_TASK_STATUSES.contains(task.getStatus())).count(),
                countTasksByStatus(transportTasks),
                nextTransportOrder,
                activeTransportOrders.stream().map(this::mapTransportOrder).toList(),
                transportTasks.stream().limit(10).map(this::mapTask).toList()
        );
    }

    private Comparator<TransportOrder> nextTransportComparator() {
        return Comparator
                .comparing((TransportOrder order) -> order.getDepartureTime() == null ? LocalDateTime.MAX : order.getDepartureTime())
                .thenComparing(order -> order.getPlannedArrivalTime() == null ? LocalDateTime.MAX : order.getPlannedArrivalTime())
                .thenComparing(TransportOrder::getId);
    }

    private Map<String, Long> countTransportOrdersByStatus(List<TransportOrder> transportOrders) {
        Map<String, Long> result = emptyEnumMap(TransportOrderStatus.values());
        transportOrders.stream()
                .collect(Collectors.groupingBy(TransportOrder::getStatus, Collectors.counting()))
                .forEach((status, count) -> result.put(status.name(), count));
        return result;
    }

    private Map<String, Long> countTasksByStatus(List<Task> tasks) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        tasks.stream()
                .collect(Collectors.groupingBy(Task::getStatus, Collectors.counting()))
                .forEach((status, count) -> result.put(status.name(), count));
        return result;
    }

    private DriverDashboardResponse.DriverTransportOrderResponse mapTransportOrder(TransportOrder order) {
        return new DriverDashboardResponse.DriverTransportOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getPriority().name(),
                order.getTotalWeight(),
                order.getDepartureTime(),
                order.getPlannedArrivalTime(),
                order.getActualArrivalTime(),
                order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getId(),
                order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getName(),
                order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getId(),
                order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getName(),
                order.getVehicle() == null ? null : order.getVehicle().getId(),
                order.getVehicle() == null ? null : order.getVehicle().getRegistrationNumber(),
                order.getVehicle() == null ? null : order.getVehicle().getBrand(),
                order.getVehicle() == null ? null : order.getVehicle().getModel(),
                order.getDescription()
        );
    }

    private DriverDashboardResponse.DriverTaskResponse mapTask(Task task) {
        TransportOrder transportOrder = task.getTransportOrder();
        return new DriverDashboardResponse.DriverTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority().name(),
                task.getStatus().name(),
                task.getDueDate(),
                transportOrder == null ? null : transportOrder.getId(),
                transportOrder == null ? null : transportOrder.getOrderNumber(),
                transportOrder == null ? null : transportOrder.getStatus().name()
        );
    }

    private Map<String, Long> emptyEnumMap(Enum<?>[] values) {
        Map<String, Long> result = new LinkedHashMap<>();
        Arrays.stream(values).forEach(value -> result.put(value.name(), 0L));
        return result;
    }
}
