package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.dashboard.DispatcherDashboardResponse;
import rs.logistics.logistics_system.entity.Employee;
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
import rs.logistics.logistics_system.service.definition.dashboard.DispatcherDashboardServiceDefinition;
import rs.logistics.logistics_system.service.implementation.dashboard.cache.DashboardResponseCache;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    private final DashboardResponseCache dashboardResponseCache;

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

        return dashboardResponseCache.get("dispatcher:" + companyId, () -> buildOverview(companyId));
    }

    private DispatcherDashboardResponse buildOverview(Long companyId) {
        long transportOrdersTotal = transportOrderRepository.countByCreatedBy_Company_Id(companyId);
        long activeTransportOrders = transportOrderRepository.countByCreatedBy_Company_IdAndStatusIn(companyId, ACTIVE_TRANSPORT_STATUSES);
        long unassignedTransportOrders = transportOrderRepository.countUnassignedByCompanyId(companyId);
        Map<String, Long> transportOrdersByStatus = countTransportOrdersByStatus(companyId);

        long vehiclesTotal = vehicleRepository.countByCompany_Id(companyId);
        long availableVehicles = vehicleRepository.countByStatusAndCompany_Id(VehicleStatus.AVAILABLE, companyId);
        long vehiclesInUse = vehicleRepository.countByStatusAndCompany_Id(VehicleStatus.IN_USE, companyId);
        Map<String, Long> vehiclesByStatus = countVehiclesByStatus(companyId);

        long driversTotal = employeeRepository.countByCompany_IdAndPosition(companyId, EmployeePosition.DRIVER);
        long activeDrivers = employeeRepository.countByCompany_IdAndPositionAndActiveTrue(companyId, EmployeePosition.DRIVER);
        long busyDrivers = transportOrderRepository.countDistinctAssignedDriversByCompanyIdAndStatusIn(companyId, ACTIVE_TRANSPORT_STATUSES);
        long availableDrivers = Math.max(activeDrivers - busyDrivers, 0);

        long dispatcherTasksTotal = taskRepository.countByAssignedEmployee_Company_IdAndAssignedEmployee_Position(companyId, EmployeePosition.DISPATCHER);
        long openDispatcherTasksTotal = taskRepository.countByAssignedEmployee_Company_IdAndAssignedEmployee_PositionAndStatusIn(companyId, EmployeePosition.DISPATCHER, OPEN_TASK_STATUSES);
        Map<String, Long> dispatcherTasksByStatus = countDispatcherTasksByStatus(companyId);

        List<TransportOrder> recentTransportOrders = transportOrderRepository.findRecentByCompanyId(companyId, PageRequest.of(0, 10));
        List<Vehicle> availableVehicleCandidates = vehicleRepository.findAvailableCandidatesByCompanyId(companyId, PageRequest.of(0, 10));
        List<Employee> availableDriverCandidates = employeeRepository.findAvailableDriversByCompanyId(companyId, ACTIVE_TRANSPORT_STATUSES, PageRequest.of(0, 10));

        return new DispatcherDashboardResponse(
                transportOrdersTotal,
                activeTransportOrders,
                unassignedTransportOrders,
                transportOrdersByStatus,
                vehiclesTotal,
                availableVehicles,
                vehiclesInUse,
                vehiclesByStatus,
                driversTotal,
                activeDrivers,
                busyDrivers,
                availableDrivers,
                dispatcherTasksTotal,
                openDispatcherTasksTotal,
                dispatcherTasksByStatus,
                buildRecentTransportOrders(recentTransportOrders),
                buildAvailableVehicleCandidates(availableVehicleCandidates),
                buildAvailableDriverCandidates(availableDriverCandidates),
                List.of(
                        DashboardResponseFactory.statusChart("transportOrdersByStatus", "Transport orders by status", transportOrdersByStatus),
                        DashboardResponseFactory.statusChart("vehiclesByStatus", "Vehicles by status", vehiclesByStatus),
                        DashboardResponseFactory.statusChart("dispatcherTasksByStatus", "Dispatcher tasks by status", dispatcherTasksByStatus),
                        DashboardResponseFactory.comparisonChart("driverAvailability", "Driver availability", "Available", availableDrivers, "Busy", busyDrivers)
                ),
                List.of(
                        DashboardResponseFactory.activeTransportsAlert(activeTransportOrders),
                        DashboardResponseFactory.alert(unassignedTransportOrders > 0 ? "WARNING" : "SUCCESS", "UNASSIGNED_TRANSPORTS", "Unassigned transports", unassignedTransportOrders > 0 ? "Transport orders are missing a driver or vehicle." : "All transport orders have dispatch resources.", unassignedTransportOrders),
                        DashboardResponseFactory.openTasksAlert(openDispatcherTasksTotal)
                )
        );
    }

    private Map<String, Long> countTransportOrdersByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(TransportOrderStatus.values());
        transportOrderRepository.countGroupedByStatusAndCompanyId(companyId).forEach(row -> result.put(((TransportOrderStatus) row[0]).name(), (Long) row[1]));
        return result;
    }

    private Map<String, Long> countVehiclesByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(VehicleStatus.values());
        vehicleRepository.countGroupedByStatusAndCompanyId(companyId).forEach(row -> result.put(((VehicleStatus) row[0]).name(), (Long) row[1]));
        return result;
    }

    private Map<String, Long> countDispatcherTasksByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        taskRepository.countGroupedByStatusAndCompanyIdAndAssignedPosition(companyId, EmployeePosition.DISPATCHER).forEach(row -> result.put(((TaskStatus) row[0]).name(), (Long) row[1]));
        return result;
    }

    private List<DispatcherDashboardResponse.RecentTransportOrderResponse> buildRecentTransportOrders(List<TransportOrder> transportOrders) {
        return transportOrders.stream()
                .map(order -> new DispatcherDashboardResponse.RecentTransportOrderResponse(
                        order.getId(), order.getOrderNumber(), order.getStatus().name(), order.getPriority().name(), order.getTotalWeight(), order.getDepartureTime(), order.getPlannedArrivalTime(),
                        order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getId(), order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getName(),
                        order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getId(), order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getName(),
                        order.getVehicle() == null ? null : order.getVehicle().getId(), order.getVehicle() == null ? null : order.getVehicle().getRegistrationNumber(),
                        order.getAssignedEmployee() == null ? null : order.getAssignedEmployee().getId(), order.getAssignedEmployee() == null ? null : employeeFullName(order.getAssignedEmployee())
                ))
                .toList();
    }

    private List<DispatcherDashboardResponse.AvailableVehicleResponse> buildAvailableVehicleCandidates(List<Vehicle> vehicles) {
        return vehicles.stream()
                .map(vehicle -> new DispatcherDashboardResponse.AvailableVehicleResponse(vehicle.getId(), vehicle.getRegistrationNumber(), vehicle.getBrand(), vehicle.getModel(), vehicle.getType(), vehicle.getCapacity()))
                .toList();
    }

    private List<DispatcherDashboardResponse.AvailableDriverResponse> buildAvailableDriverCandidates(List<Employee> drivers) {
        return drivers.stream()
                .map(driver -> new DispatcherDashboardResponse.AvailableDriverResponse(driver.getId(), driver.getFirstName(), driver.getLastName(), driver.getEmail(), driver.getPhoneNumber()))
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
