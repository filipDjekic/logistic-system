package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.LifecycleAlertResponse;
import rs.logistics.logistics_system.dto.response.LifecycleAnalyticsResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationSourceType;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.LifecycleMonitoringServiceDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.implementation.dashboard.cache.DashboardResponseCache;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LifecycleMonitoringService implements LifecycleMonitoringServiceDefinition {

    private static final String ROLE_COMPANY_ADMIN = "COMPANY_ADMIN";
    private static final Duration TASK_STUCK_AFTER = Duration.ofHours(12);
    private static final Duration TRANSPORT_STUCK_AFTER = Duration.ofHours(8);
    private static final Duration VEHICLE_RESERVED_STALE_AFTER = Duration.ofHours(6);

    private static final List<TaskStatus> ACTIVE_TASK_STATUSES = List.of(
            TaskStatus.NEW,
            TaskStatus.OPEN,
            TaskStatus.ASSIGNED,
            TaskStatus.IN_PROGRESS,
            TaskStatus.BLOCKED
    );

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = List.of(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING,
            TransportOrderStatus.RESCHEDULED
    );

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final WarehouseRepository warehouseRepository;
    private final TaskRepository taskRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final NotificationServiceDefinition notificationService;
    private final TimeServiceDefinition timeService;
    private final DashboardResponseCache dashboardResponseCache;

    @Override
    @Transactional(readOnly = true)
    public LifecycleAnalyticsResponse getAnalytics() {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        RoleProfile profile = RoleProfile.from(user.getRole() != null ? user.getRole().getName() : null);
        Long userId = user.getId();
        Long companyId = profile == RoleProfile.OVERLORD ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Employee employee = employeeRepository.findByUser_Id(userId).orElse(null);
        Set<Long> managedWarehouseIds = resolveManagedWarehouseIds(profile, companyId, employee);
        String cacheKey = "lifecycle:" + profile.name() + ":" + (companyId == null ? "global" : companyId) + ":" + userId + ":" + managedWarehouseIds.stream().sorted().map(String::valueOf).collect(Collectors.joining(","));
        return dashboardResponseCache.get(cacheKey, () -> buildAnalytics(profile, companyId, userId, managedWarehouseIds, timeService.nowSystem()));
    }

    @Override
    @Transactional
    public void runMonitoringSweep() {
        LocalDateTime now = timeService.nowSystem();
        Long companyId = authenticatedUserProvider.hasAuthenticatedUserContext() && !authenticatedUserProvider.isOverlord()
                ? authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                : null;

        LifecycleSnapshot snapshot = snapshot(companyId, now);
        notifyBlockedTasks(snapshot.blockedTasks());
        notifyStuckTasks(snapshot.stuckTasks(), now);
        notifyOverdueTransports(snapshot.overdueTransports(), now);
        notifyStaleReservedVehicles(snapshot.staleReservedVehicles(), snapshot.activeTransports(), now);
    }

    private LifecycleAnalyticsResponse buildAnalytics(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now) {
        LocalDateTime stuckTaskThreshold = now.minus(TASK_STUCK_AFTER);
        LocalDateTime stuckTransportThreshold = now.minus(TRANSPORT_STUCK_AFTER);
        LocalDateTime staleVehicleThreshold = now.minus(VEHICLE_RESERVED_STALE_AFTER);

        long activeTasks = countActiveTasks(profile, companyId, userId, managedWarehouseIds);
        long overdueTasks = countOverdueTasks(profile, companyId, userId, managedWarehouseIds, now);
        long blockedTasks = countBlockedTasks(profile, companyId, userId, managedWarehouseIds);
        long stuckTasks = countStuckTasks(profile, companyId, userId, managedWarehouseIds, stuckTaskThreshold);

        long activeTransports = countActiveTransports(profile, companyId, userId, managedWarehouseIds);
        long overdueTransports = countOverdueTransports(profile, companyId, userId, managedWarehouseIds, now);
        long stuckTransports = countStuckTransports(profile, companyId, userId, managedWarehouseIds, stuckTransportThreshold);
        long staleReservedVehicles = profile.showFleetLifecycle()
                ? vehicleRepository.countStaleReservedVehicles(companyId, staleVehicleThreshold)
                : 0;
        long activeOperationalFlows = activeTasks + activeTransports;

        return new LifecycleAnalyticsResponse(
                now,
                buildAlerts(profile, overdueTasks, blockedTasks, stuckTasks, overdueTransports, stuckTransports, staleReservedVehicles),
                countTasksByStatus(profile, companyId, userId, managedWarehouseIds),
                countTransportsByStatus(profile, companyId, userId, managedWarehouseIds),
                countVehiclesByStatus(profile, companyId),
                overdueTasks,
                blockedTasks,
                stuckTasks,
                overdueTransports,
                staleReservedVehicles,
                activeOperationalFlows
        );
    }

    private List<LifecycleAlertResponse> buildAlerts(RoleProfile profile, long overdueTasks, long blockedTasks, long stuckTasks, long overdueTransports, long stuckTransports, long staleReservedVehicles) {
        List<LifecycleAlertResponse> alerts = new java.util.ArrayList<>();

        if (profile.showTaskLifecycle()) {
            alerts.add(alert(overdueTasks > 0 ? "CRITICAL" : "SUCCESS", profile.isPersonal() ? "MY_LIFECYCLE_OVERDUE_TASKS" : "LIFECYCLE_OVERDUE_TASKS", profile.isPersonal() ? "My overdue tasks" : "Overdue tasks", overdueTasks > 0 ? "Tasks passed due date and still require completion." : "No overdue task lifecycle issues detected.", overdueTasks, "TASK", tasksRoute(profile, null)));
            alerts.add(alert(blockedTasks > 0 ? "WARNING" : "SUCCESS", profile.isPersonal() ? "MY_LIFECYCLE_BLOCKED_TASKS" : "LIFECYCLE_BLOCKED_TASKS", profile.isPersonal() ? "My blocked tasks" : "Blocked tasks", blockedTasks > 0 ? "Blocked tasks need recovery or reassignment." : "No blocked tasks detected.", blockedTasks, "TASK", tasksRoute(profile, "BLOCKED")));
            alerts.add(alert(stuckTasks > 0 ? "WARNING" : "SUCCESS", profile.isPersonal() ? "MY_LIFECYCLE_STUCK_TASKS" : "LIFECYCLE_STUCK_TASKS", profile.isPersonal() ? "My stuck task states" : "Stuck task states", stuckTasks > 0 ? "Tasks have not moved for the configured lifecycle window." : "No stuck task lifecycle states detected.", stuckTasks, "TASK", tasksRoute(profile, null)));
        }

        if (profile.showTransportLifecycle()) {
            alerts.add(alert(overdueTransports > 0 ? "CRITICAL" : "SUCCESS", profile == RoleProfile.DRIVER ? "MY_LIFECYCLE_OVERDUE_TRANSPORTS" : "LIFECYCLE_OVERDUE_TRANSPORTS", profile == RoleProfile.DRIVER ? "My overdue transports" : "Overdue transports", overdueTransports > 0 ? "Active transports passed planned arrival time." : "No overdue transport flows detected.", overdueTransports, "TRANSPORT_ORDER", transportOrdersRoute(profile, null)));
            alerts.add(alert(stuckTransports > 0 ? "WARNING" : "SUCCESS", profile == RoleProfile.DRIVER ? "MY_LIFECYCLE_STUCK_TRANSPORTS" : "LIFECYCLE_STUCK_TRANSPORTS", profile == RoleProfile.DRIVER ? "My stuck transports" : "Stuck transport states", stuckTransports > 0 ? "Transport orders have not moved for the configured lifecycle window." : "No stuck transport states detected.", stuckTransports, "TRANSPORT_ORDER", transportOrdersRoute(profile, null)));
        }

        if (profile.showFleetLifecycle()) {
            alerts.add(alert(staleReservedVehicles > 0 ? "WARNING" : "SUCCESS", "LIFECYCLE_STALE_RESERVED_VEHICLES", "Stale vehicle reservations", staleReservedVehicles > 0 ? "Reserved vehicles have no recent lifecycle update." : "No stale vehicle reservations detected.", staleReservedVehicles, "VEHICLE", "/vehicles?status=RESERVED"));
        }

        return alerts;
    }

    private String tasksRoute(RoleProfile profile, String status) {
        java.util.List<String> params = new java.util.ArrayList<>();
        if (profile.isPersonal()) {
            params.add("assignedToMe=true");
        }
        if (status != null && !status.isBlank()) {
            params.add("status=" + status);
        }
        return params.isEmpty() ? "/tasks" : "/tasks?" + String.join("&", params);
    }

    private String transportOrdersRoute(RoleProfile profile, String status) {
        java.util.List<String> params = new java.util.ArrayList<>();
        if (profile == RoleProfile.DRIVER) {
            params.add("assignedToMe=true");
        }
        if (status != null && !status.isBlank()) {
            params.add("status=" + status);
        }
        return params.isEmpty() ? "/transport-orders" : "/transport-orders?" + String.join("&", params);
    }

    private long countActiveTasks(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds) {
        if (!profile.showTaskLifecycle()) {
            return 0;
        }
        if (profile.isPersonal()) {
            return taskRepository.countByAssignedEmployee_User_IdAndStatusIn(userId, ACTIVE_TASK_STATUSES);
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : taskRepository.countForManagedWarehousesAndStatusIn(companyId, managedWarehouseIds, ACTIVE_TASK_STATUSES);
        }
        return companyId == null ? taskRepository.countByStatusIn(ACTIVE_TASK_STATUSES) : taskRepository.countByAssignedEmployee_Company_IdAndStatusIn(companyId, ACTIVE_TASK_STATUSES);
    }

    private long countOverdueTasks(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now) {
        if (!profile.showTaskLifecycle()) {
            return 0;
        }
        if (profile.isPersonal()) {
            return taskRepository.countByAssignedEmployee_User_IdAndDueDateBeforeAndStatusIn(userId, now, ACTIVE_TASK_STATUSES);
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : taskRepository.countForManagedWarehousesAndDueDateBeforeAndStatusIn(companyId, managedWarehouseIds, now, ACTIVE_TASK_STATUSES);
        }
        return companyId == null ? taskRepository.countByDueDateBeforeAndStatusIn(now, ACTIVE_TASK_STATUSES) : taskRepository.countByAssignedEmployee_Company_IdAndDueDateBeforeAndStatusIn(companyId, now, ACTIVE_TASK_STATUSES);
    }

    private long countBlockedTasks(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds) {
        if (!profile.showTaskLifecycle()) {
            return 0;
        }
        if (profile.isPersonal()) {
            return taskRepository.countByAssignedEmployee_User_IdAndStatus(userId, TaskStatus.BLOCKED);
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : taskRepository.countForManagedWarehousesAndStatusIn(companyId, managedWarehouseIds, List.of(TaskStatus.BLOCKED));
        }
        return companyId == null ? taskRepository.countByStatus(TaskStatus.BLOCKED) : taskRepository.countByAssignedEmployee_Company_IdAndStatus(companyId, TaskStatus.BLOCKED);
    }

    private long countStuckTasks(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime threshold) {
        if (!profile.showTaskLifecycle()) {
            return 0;
        }
        if (profile.isPersonal()) {
            return taskRepository.countStuckOperationalTasksForUser(userId, ACTIVE_TASK_STATUSES, threshold);
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : taskRepository.countStuckOperationalTasksForManagedWarehouses(companyId, managedWarehouseIds, ACTIVE_TASK_STATUSES, threshold);
        }
        return taskRepository.countStuckOperationalTasks(companyId, ACTIVE_TASK_STATUSES, threshold);
    }

    private long countActiveTransports(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds) {
        if (!profile.showTransportLifecycle()) {
            return 0;
        }
        if (profile == RoleProfile.DRIVER) {
            return transportOrderRepository.countByAssignedEmployee_User_IdAndStatusIn(userId, ACTIVE_TRANSPORT_STATUSES);
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : transportOrderRepository.countByCompanyIdAndStatusInAndWarehouseIds(companyId, ACTIVE_TRANSPORT_STATUSES, managedWarehouseIds);
        }
        return companyId == null ? transportOrderRepository.countByStatusIn(ACTIVE_TRANSPORT_STATUSES) : transportOrderRepository.countByCreatedBy_Company_IdAndStatusIn(companyId, ACTIVE_TRANSPORT_STATUSES);
    }

    private long countOverdueTransports(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now) {
        if (!profile.showTransportLifecycle()) {
            return 0;
        }
        if (profile == RoleProfile.DRIVER) {
            return transportOrderRepository.countByAssignedEmployee_User_IdAndPlannedArrivalTimeBeforeAndStatusIn(userId, now, ACTIVE_TRANSPORT_STATUSES);
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : transportOrderRepository.countByCompanyIdAndWarehouseIdsAndPlannedArrivalTimeBeforeAndStatusIn(companyId, managedWarehouseIds, now, ACTIVE_TRANSPORT_STATUSES);
        }
        return companyId == null ? transportOrderRepository.countByPlannedArrivalTimeBeforeAndStatusIn(now, ACTIVE_TRANSPORT_STATUSES) : transportOrderRepository.countByCreatedBy_Company_IdAndPlannedArrivalTimeBeforeAndStatusIn(companyId, now, ACTIVE_TRANSPORT_STATUSES);
    }

    private long countStuckTransports(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime threshold) {
        if (!profile.showTransportLifecycle()) {
            return 0;
        }
        if (profile == RoleProfile.DRIVER) {
            return transportOrderRepository.countStuckOperationalTransportsForDriver(userId, ACTIVE_TRANSPORT_STATUSES, threshold);
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : transportOrderRepository.countStuckOperationalTransportsForWarehouses(companyId, managedWarehouseIds, ACTIVE_TRANSPORT_STATUSES, threshold);
        }
        return transportOrderRepository.countStuckOperationalTransports(companyId, ACTIVE_TRANSPORT_STATUSES, threshold);
    }

    private LifecycleSnapshot snapshot(Long companyId, LocalDateTime now) {
        List<Task> tasks = companyId == null ? taskRepository.findAll() : taskRepository.findAllByAssignedEmployee_Company_Id(companyId);
        List<TransportOrder> transports = companyId == null ? transportOrderRepository.findAll() : transportOrderRepository.findAllByCreatedBy_Company_Id(companyId);
        List<Vehicle> vehicles = companyId == null ? vehicleRepository.findAll() : vehicleRepository.findAllByCompany_Id(companyId);

        LocalDateTime stuckTaskThreshold = now.minus(TASK_STUCK_AFTER);
        LocalDateTime staleVehicleThreshold = now.minus(VEHICLE_RESERVED_STALE_AFTER);

        List<Task> activeTasks = tasks.stream()
                .filter(task -> task.getStatus() != null && ACTIVE_TASK_STATUSES.contains(task.getStatus()))
                .toList();

        List<Task> blockedTasks = tasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.BLOCKED)
                .toList();

        List<Task> stuckTasks = activeTasks.stream()
                .filter(task -> lastTouched(task.getUpdatedAt(), task.getCreatedAt()).isBefore(stuckTaskThreshold))
                .toList();

        List<TransportOrder> activeTransports = transports.stream()
                .filter(order -> order.getStatus() != null && ACTIVE_TRANSPORT_STATUSES.contains(order.getStatus()))
                .toList();

        List<TransportOrder> overdueTransports = activeTransports.stream()
                .filter(order -> order.getPlannedArrivalTime() != null && order.getPlannedArrivalTime().isBefore(now))
                .toList();

        Set<Long> vehiclesWithActiveTransports = activeTransports.stream()
                .map(TransportOrder::getVehicle)
                .filter(Objects::nonNull)
                .map(Vehicle::getId)
                .collect(Collectors.toSet());

        List<Vehicle> staleReservedVehicles = vehicles.stream()
                .filter(vehicle -> vehicle.getStatus() == VehicleStatus.RESERVED)
                .filter(vehicle -> !vehiclesWithActiveTransports.contains(vehicle.getId()))
                .filter(vehicle -> lastTouched(vehicle.getUpdatedAt(), null).isBefore(staleVehicleThreshold))
                .toList();

        return new LifecycleSnapshot(activeTransports, blockedTasks, stuckTasks, overdueTransports, staleReservedVehicles);
    }

    private void notifyBlockedTasks(List<Task> blockedTasks) {
        for (Task task : blockedTasks) {
            Set<User> targets = taskTargets(task);
            for (User target : targets) {
                notificationService.createOperationalNotification(
                        target.getId(),
                        "Blocked lifecycle task",
                        "Task #" + task.getId() + " is blocked and requires recovery: " + task.getTitle(),
                        NotificationType.WARNING,
                        NotificationSeverity.WARNING,
                        NotificationCategory.TASK,
                        NotificationSourceType.TASK,
                        task.getId(),
                        "LIFECYCLE_BLOCKED_TASK:" + task.getId() + ":" + target.getId()
                );
            }
        }
    }

    private void notifyStuckTasks(List<Task> stuckTasks, LocalDateTime now) {
        for (Task task : stuckTasks) {
            long hours = Duration.between(lastTouched(task.getUpdatedAt(), task.getCreatedAt()), now).toHours();
            Set<User> targets = taskTargets(task);
            for (User target : targets) {
                notificationService.createOperationalNotification(
                        target.getId(),
                        "Stuck task lifecycle",
                        "Task #" + task.getId() + " has stayed in " + task.getStatus() + " for about " + hours + " hours.",
                        NotificationType.WARNING,
                        NotificationSeverity.WARNING,
                        NotificationCategory.TASK,
                        NotificationSourceType.TASK,
                        task.getId(),
                        "LIFECYCLE_STUCK_TASK:" + task.getId() + ":" + target.getId()
                );
            }
        }
    }

    private void notifyOverdueTransports(List<TransportOrder> overdueTransports, LocalDateTime now) {
        for (TransportOrder order : overdueTransports) {
            long hours = Duration.between(order.getPlannedArrivalTime(), now).toHours();
            Set<User> targets = transportTargets(order);
            for (User target : targets) {
                notificationService.createOperationalNotification(
                        target.getId(),
                        "Overdue transport lifecycle",
                        "Transport " + order.getOrderNumber() + " is " + hours + " hours past planned arrival and still in " + order.getStatus() + ".",
                        NotificationType.ERROR,
                        NotificationSeverity.CRITICAL,
                        NotificationCategory.TRANSPORT,
                        NotificationSourceType.TRANSPORT_ORDER,
                        order.getId(),
                        "LIFECYCLE_OVERDUE_TRANSPORT:" + order.getId() + ":" + target.getId()
                );
            }
        }
    }

    private void notifyStaleReservedVehicles(List<Vehicle> staleReservedVehicles, List<TransportOrder> activeTransports, LocalDateTime now) {
        Set<Long> activeVehicleIds = activeTransports.stream()
                .map(TransportOrder::getVehicle)
                .filter(Objects::nonNull)
                .map(Vehicle::getId)
                .collect(Collectors.toSet());

        for (Vehicle vehicle : staleReservedVehicles) {
            long hours = Duration.between(lastTouched(vehicle.getUpdatedAt(), null), now).toHours();
            Set<User> targets = new LinkedHashSet<>(companyAdmins(vehicle.getCompany()));
            for (User target : targets) {
                notificationService.createOperationalNotification(
                        target.getId(),
                        "Stale vehicle reservation",
                        "Vehicle " + vehicle.getRegistrationNumber() + " is RESERVED for about " + hours + " hours" + (activeVehicleIds.contains(vehicle.getId()) ? " while linked transport is stuck." : " without an active transport."),
                        NotificationType.WARNING,
                        NotificationSeverity.WARNING,
                        NotificationCategory.TRANSPORT,
                        NotificationSourceType.SYSTEM,
                        vehicle.getId(),
                        "LIFECYCLE_STALE_VEHICLE:" + vehicle.getId() + ":" + target.getId()
                );
            }
        }
    }

    private Set<User> taskTargets(Task task) {
        Set<User> targets = new LinkedHashSet<>();
        if (task.getAssignedEmployee() != null) {
            if (task.getAssignedEmployee().getUser() != null) {
                targets.add(task.getAssignedEmployee().getUser());
            }
            targets.addAll(companyAdmins(task.getAssignedEmployee().getCompany()));
        }
        return targets;
    }

    private Set<User> transportTargets(TransportOrder order) {
        Set<User> targets = new LinkedHashSet<>();
        if (order.getCreatedBy() != null) {
            targets.add(order.getCreatedBy());
            targets.addAll(companyAdmins(order.getCreatedBy().getCompany()));
        }
        if (order.getAssignedEmployee() != null && order.getAssignedEmployee().getUser() != null) {
            targets.add(order.getAssignedEmployee().getUser());
        }
        return targets;
    }

    private List<User> companyAdmins(Company company) {
        if (company == null || company.getId() == null) {
            return List.of();
        }
        return userRepository.findByCompany_IdAndRole_NameIgnoreCaseAndEnabledTrue(company.getId(), ROLE_COMPANY_ADMIN);
    }

    private Set<Long> resolveManagedWarehouseIds(RoleProfile profile, Long companyId, Employee employee) {
        if (profile != RoleProfile.WAREHOUSE_MANAGER || companyId == null || employee == null || employee.getId() == null) {
            return Set.of();
        }
        return warehouseRepository.findByManagerIdAndCompany_Id(employee.getId(), companyId).stream()
                .map(Warehouse::getId)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private LifecycleAlertResponse alert(String severity, String key, String title, String message, long count, String entityType, String route) {
        return new LifecycleAlertResponse(severity, key, title, message, count, entityType, route);
    }

    private Map<String, Long> countTasksByStatus(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds) {
        if (!profile.showTaskLifecycle()) {
            return enumCountMap(TaskStatus.values(), List.of());
        }
        List<Object[]> rows;
        if (profile.isPersonal()) {
            rows = taskRepository.countGroupedByStatusAndAssignedUserId(userId);
        } else if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            rows = managedWarehouseIds.isEmpty() ? List.of() : taskRepository.countGroupedByStatusForManagedWarehouses(companyId, managedWarehouseIds);
        } else {
            rows = taskRepository.countGroupedByStatusFiltered(companyId, null, null, null, null, null, false, false, false, List.of(-1L), null);
        }
        return enumCountMap(TaskStatus.values(), rows);
    }

    private Map<String, Long> countTransportsByStatus(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds) {
        if (!profile.showTransportLifecycle()) {
            return enumCountMap(TransportOrderStatus.values(), List.of());
        }
        List<Object[]> rows;
        if (profile == RoleProfile.DRIVER) {
            rows = transportOrderRepository.countGroupedByStatusAndAssignedUserId(userId);
        } else if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            rows = managedWarehouseIds.isEmpty() ? List.of() : transportOrderRepository.countGroupedByStatusAndCompanyIdAndWarehouseIds(companyId, managedWarehouseIds);
        } else {
            rows = companyId == null ? transportOrderRepository.countGroupedByStatus() : transportOrderRepository.countGroupedByStatusAndCompanyId(companyId);
        }
        return enumCountMap(TransportOrderStatus.values(), rows);
    }

    private Map<String, Long> countVehiclesByStatus(RoleProfile profile, Long companyId) {
        if (!profile.showFleetLifecycle()) {
            return enumCountMap(VehicleStatus.values(), List.of());
        }
        List<Object[]> rows = companyId == null ? vehicleRepository.countGroupedByStatus() : vehicleRepository.countGroupedByStatusAndCompanyId(companyId);
        return enumCountMap(VehicleStatus.values(), rows);
    }

    private <E extends Enum<E>> Map<String, Long> enumCountMap(E[] values, List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        Arrays.stream(values)
                .sorted(Comparator.comparing(Enum::name))
                .forEach(value -> result.put(value.name(), 0L));

        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            result.put(((Enum<?>) row[0]).name(), ((Number) row[1]).longValue());
        }
        return result;
    }

    private LocalDateTime lastTouched(LocalDateTime updatedAt, LocalDateTime createdAt) {
        if (updatedAt != null) {
            return updatedAt;
        }
        if (createdAt != null) {
            return createdAt;
        }
        return LocalDateTime.MIN;
    }

    private record LifecycleSnapshot(
            List<TransportOrder> activeTransports,
            List<Task> blockedTasks,
            List<Task> stuckTasks,
            List<TransportOrder> overdueTransports,
            List<Vehicle> staleReservedVehicles
    ) {
    }

    private enum RoleProfile {
        OVERLORD,
        COMPANY_ADMIN,
        WAREHOUSE_MANAGER,
        DISPATCHER,
        DRIVER,
        WORKER,
        HR_MANAGER,
        READ_ONLY;

        static RoleProfile from(String role) {
            if (role == null || role.isBlank()) {
                return READ_ONLY;
            }
            try {
                return RoleProfile.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                return READ_ONLY;
            }
        }

        boolean showTaskLifecycle() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == WAREHOUSE_MANAGER || this == DISPATCHER || this == DRIVER || this == WORKER || this == HR_MANAGER;
        }

        boolean showTransportLifecycle() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == DISPATCHER || this == DRIVER || this == WAREHOUSE_MANAGER;
        }

        boolean showFleetLifecycle() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == DISPATCHER;
        }

        boolean isPersonal() {
            return this == DRIVER || this == WORKER;
        }
    }
}
