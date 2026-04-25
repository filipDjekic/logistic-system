package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.DispatcherDashboardResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.DispatcherDashboardServiceDefinition;

import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DispatcherDashboardService implements DispatcherDashboardServiceDefinition {

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
    private final VehicleRepository vehicleRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    public DispatcherDashboardResponse getOverview() {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Employee dispatcher = employeeRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user is not linked to an employee"));

        if (dispatcher.getPosition() != EmployeePosition.DISPATCHER) {
            throw new ForbiddenException("Only dispatchers can access dispatcher dashboard");
        }

        List<TransportOrder> transportOrders = transportOrderRepository.findAllByCreatedBy_Company_Id(companyId);
        List<Vehicle> vehicles = vehicleRepository.findAllByCompany_Id(companyId);
        List<Employee> drivers = employeeRepository.findByPositionAndCompany_Id(EmployeePosition.DRIVER, companyId);
        List<Task> companyTasks = taskRepository.findAllByAssignedEmployee_Company_Id(companyId);

        Set<Long> busyDriverIds = transportOrders.stream()
                .filter(order -> ACTIVE_TRANSPORT_STATUSES.contains(order.getStatus()))
                .filter(order -> order.getAssignedEmployee() != null)
                .map(order -> order.getAssignedEmployee().getId())
                .collect(Collectors.toSet());

        List<Task> dispatcherTasks = companyTasks.stream()
                .filter(task -> task.getAssignedEmployee() != null)
                .filter(task -> task.getAssignedEmployee().getPosition() == EmployeePosition.DISPATCHER)
                .toList();

        return new DispatcherDashboardResponse(
                transportOrders.size(),
                transportOrders.stream().filter(order -> ACTIVE_TRANSPORT_STATUSES.contains(order.getStatus())).count(),
                transportOrders.stream().filter(order -> order.getAssignedEmployee() == null || order.getVehicle() == null).count(),
                countTransportOrdersByStatus(transportOrders),
                vehicles.size(),
                vehicles.stream().filter(vehicle -> vehicle.getStatus() == VehicleStatus.AVAILABLE).count(),
                vehicles.stream().filter(vehicle -> vehicle.getStatus() == VehicleStatus.IN_USE).count(),
                countVehiclesByStatus(vehicles),
                drivers.size(),
                drivers.stream().filter(driver -> Boolean.TRUE.equals(driver.getActive())).count(),
                busyDriverIds.size(),
                drivers.stream()
                        .filter(driver -> Boolean.TRUE.equals(driver.getActive()))
                        .filter(driver -> !busyDriverIds.contains(driver.getId()))
                        .count(),
                dispatcherTasks.size(),
                dispatcherTasks.stream().filter(task -> OPEN_TASK_STATUSES.contains(task.getStatus())).count(),
                countTasksByStatus(dispatcherTasks),
                buildRecentTransportOrders(transportOrders),
                buildAvailableVehicleCandidates(vehicles),
                buildAvailableDriverCandidates(drivers, busyDriverIds)
        );
    }

    private Map<String, Long> countTransportOrdersByStatus(List<TransportOrder> transportOrders) {
        Map<String, Long> result = emptyEnumMap(TransportOrderStatus.values());
        transportOrders.stream()
                .collect(Collectors.groupingBy(TransportOrder::getStatus, Collectors.counting()))
                .forEach((status, count) -> result.put(status.name(), count));
        return result;
    }

    private Map<String, Long> countVehiclesByStatus(List<Vehicle> vehicles) {
        Map<String, Long> result = emptyEnumMap(VehicleStatus.values());
        vehicles.stream()
                .collect(Collectors.groupingBy(Vehicle::getStatus, Collectors.counting()))
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

    private List<DispatcherDashboardResponse.RecentTransportOrderResponse> buildRecentTransportOrders(List<TransportOrder> transportOrders) {
        return transportOrders.stream()
                .sorted(Comparator.comparing(TransportOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(order -> new DispatcherDashboardResponse.RecentTransportOrderResponse(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getStatus().name(),
                        order.getPriority().name(),
                        order.getTotalWeight(),
                        order.getDepartureTime(),
                        order.getPlannedArrivalTime(),
                        order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getId(),
                        order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getName(),
                        order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getId(),
                        order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getName(),
                        order.getVehicle() == null ? null : order.getVehicle().getId(),
                        order.getVehicle() == null ? null : order.getVehicle().getRegistrationNumber(),
                        order.getAssignedEmployee() == null ? null : order.getAssignedEmployee().getId(),
                        order.getAssignedEmployee() == null ? null : employeeFullName(order.getAssignedEmployee())
                ))
                .toList();
    }

    private List<DispatcherDashboardResponse.AvailableVehicleResponse> buildAvailableVehicleCandidates(List<Vehicle> vehicles) {
        return vehicles.stream()
                .filter(vehicle -> vehicle.getStatus() == VehicleStatus.AVAILABLE)
                .filter(vehicle -> Boolean.TRUE.equals(vehicle.getActive()))
                .sorted(Comparator.comparing(Vehicle::getRegistrationNumber, Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(10)
                .map(vehicle -> new DispatcherDashboardResponse.AvailableVehicleResponse(
                        vehicle.getId(),
                        vehicle.getRegistrationNumber(),
                        vehicle.getBrand(),
                        vehicle.getModel(),
                        vehicle.getType(),
                        vehicle.getCapacity()
                ))
                .toList();
    }

    private List<DispatcherDashboardResponse.AvailableDriverResponse> buildAvailableDriverCandidates(
            List<Employee> drivers,
            Set<Long> busyDriverIds
    ) {
        return drivers.stream()
                .filter(driver -> Boolean.TRUE.equals(driver.getActive()))
                .filter(driver -> !busyDriverIds.contains(driver.getId()))
                .sorted(Comparator.comparing(Employee::getLastName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(Employee::getFirstName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(10)
                .map(driver -> new DispatcherDashboardResponse.AvailableDriverResponse(
                        driver.getId(),
                        driver.getFirstName(),
                        driver.getLastName(),
                        driver.getEmail(),
                        driver.getPhoneNumber()
                ))
                .toList();
    }

    private Map<String, Long> emptyEnumMap(Enum<?>[] values) {
        Map<String, Long> result = new LinkedHashMap<>();
        Arrays.stream(values).forEach(value -> result.put(value.name(), 0L));
        return result;
    }

    private String employeeFullName(Employee employee) {
        return employee.getFirstName() + " " + employee.getLastName();
    }
}
