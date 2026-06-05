package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.dashboard.OperationalDashboardResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.dashboard.OperationalDashboardServiceDefinition;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class OperationalDashboardService implements OperationalDashboardServiceDefinition {

    private static final List<TaskStatus> OPEN_TASK_STATUSES = List.of(
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
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final TaskRepository taskRepository;
    private final VehicleRepository vehicleRepository;
    private final StockMovementRepository stockMovementRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public OperationalDashboardResponse getOverview() {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        RoleProfile profile = RoleProfile.from(user.getRole() != null ? user.getRole().getName() : null);
        Long userId = user.getId();
        Long companyId = profile == RoleProfile.OVERLORD
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Employee employee = employeeRepository.findByUser_Id(userId).orElse(null);
        Set<Long> managedWarehouseIds = resolveManagedWarehouseIds(profile, companyId, employee);

        LocalDateTime now = LocalDateTime.now();

        long lowStockCount = countLowStock(profile, companyId, managedWarehouseIds);
        long delayedTransports = countDelayedTransports(profile, companyId, userId, now);
        long activeTransports = countActiveTransports(profile, companyId, userId);
        long blockedTasks = countBlockedTasks(profile, companyId, userId, managedWarehouseIds);
        long overdueTasks = countOverdueTasks(profile, companyId, userId, managedWarehouseIds, now);

        long reservedVehicles = profile.showFleetWidgets()
                ? (companyId == null ? vehicleRepository.countByStatus(VehicleStatus.RESERVED) : vehicleRepository.countByStatusAndCompany_Id(VehicleStatus.RESERVED, companyId))
                : 0;
        long vehiclesInUse = profile.showFleetWidgets()
                ? (companyId == null ? vehicleRepository.countByStatus(VehicleStatus.IN_USE) : vehicleRepository.countByStatusAndCompany_Id(VehicleStatus.IN_USE, companyId))
                : 0;
        long vehiclesTotal = profile.showFleetWidgets()
                ? (companyId == null ? vehicleRepository.count() : vehicleRepository.countByCompany_Id(companyId))
                : 0;

        List<OperationalDashboardResponse.OperationalWarehouseCongestionResponse> warehouseCongestion = buildWarehouseCongestion(profile, companyId, managedWarehouseIds);
        long congestedWarehouses = warehouseCongestion.stream().filter(item -> "error".equals(item.severity()) || "warning".equals(item.severity())).count();

        long recentMovementActivity = countRecentMovementActivity(profile, companyId, managedWarehouseIds, now);

        List<OperationalDashboardResponse.OperationalWidgetResponse> widgets = buildWidgets(
                profile,
                congestedWarehouses,
                lowStockCount,
                delayedTransports,
                activeTransports,
                blockedTasks,
                overdueTasks,
                reservedVehicles + vehiclesInUse,
                vehiclesTotal,
                recentMovementActivity
        );

        List<OperationalDashboardResponse.OperationalFlowResponse> flows = buildRoleAwareFlows(profile, companyId, userId, managedWarehouseIds, now);

        List<OperationalDashboardResponse.OperationalNextActionResponse> nextActions = buildNextActions(profile);
        List<OperationalDashboardResponse.OperationalLiveAlertResponse> liveAlerts = buildLiveAlerts(profile, companyId, userId, lowStockCount, delayedTransports, blockedTasks, overdueTasks, now);
        List<OperationalDashboardResponse.OperationalIncidentResponse> incidents = buildIncidents(profile, lowStockCount, delayedTransports, blockedTasks, overdueTasks, congestedWarehouses);
        List<OperationalDashboardResponse.OperationalWorkloadResponse> workload = buildWorkload(profile, companyId, userId, managedWarehouseIds, now);
        OperationalDashboardResponse.OperationalSlaResponse sla = buildSla(profile, companyId, userId, managedWarehouseIds, now, overdueTasks, delayedTransports);

        return new OperationalDashboardResponse(
                now,
                operationalTitle(profile),
                operationalDescription(profile),
                operationalEmptyMessage(profile),
                widgets,
                flows,
                nextActions,
                liveAlerts,
                incidents,
                workload,
                warehouseCongestion,
                sla
        );
    }


    private List<OperationalDashboardResponse.OperationalLiveAlertResponse> buildLiveAlerts(
            RoleProfile profile,
            Long companyId,
            Long userId,
            long lowStockCount,
            long delayedTransports,
            long blockedTasks,
            long overdueTasks,
            LocalDateTime now
    ) {
        List<OperationalDashboardResponse.OperationalLiveAlertResponse> alerts = new ArrayList<>();
        long criticalNotifications = countUnreadCriticalNotifications(profile, companyId, userId);
        if (criticalNotifications > 0) {
            alerts.add(liveAlert(
                    "critical-notifications",
                    "Critical unread notifications",
                    criticalNotifications + " critical notification(s) require acknowledgement.",
                    "error",
                    "/notifications?status=UNREAD&severity=CRITICAL",
                    "Open notifications",
                    now
            ));
        }
        if (delayedTransports > 0) {
            alerts.add(liveAlert("delayed-transports", "Delayed transports", delayedTransports + " active transport(s) passed planned arrival.", "error", transportOrdersRoute(profile, "IN_TRANSIT"), "Review transports", now));
        }
        if (blockedTasks > 0) {
            alerts.add(liveAlert("blocked-tasks", "Blocked workflow tasks", blockedTasks + " blocked task(s) need recovery action.", "error", tasksRoute(profile, "BLOCKED"), "Open tasks", now));
        }
        if (overdueTasks > 0) {
            alerts.add(liveAlert("overdue-tasks", "Overdue operational tasks", overdueTasks + " open task(s) are past due.", "warning", tasksRoute(profile, null), "Open tasks", now));
        }
        if (lowStockCount > 0 && profile.showWarehouseWidgets()) {
            alerts.add(liveAlert("low-stock", "Low stock pressure", lowStockCount + " inventory row(s) are at or below minimum stock.", "warning", inventoryRoute(profile, null, "LOW_STOCK"), "Review inventory", now));
        }
        return alerts.stream().limit(6).toList();
    }

    private long countUnreadCriticalNotifications(RoleProfile profile, Long companyId, Long userId) {
        if (profile == RoleProfile.READ_ONLY || userId == null) {
            return 0;
        }
        return companyId == null
                ? notificationRepository.countByUserIdAndStatusAndSeverity(userId, NotificationStatus.UNREAD, NotificationSeverity.CRITICAL)
                : notificationRepository.countByUserIdAndStatusAndSeverityAndUser_Company_Id(userId, NotificationStatus.UNREAD, NotificationSeverity.CRITICAL, companyId);
    }

    private List<OperationalDashboardResponse.OperationalIncidentResponse> buildIncidents(
            RoleProfile profile,
            long lowStockCount,
            long delayedTransports,
            long blockedTasks,
            long overdueTasks,
            long congestedWarehouses
    ) {
        List<OperationalDashboardResponse.OperationalIncidentResponse> incidents = new ArrayList<>();
        if (delayedTransports > 0 && profile.showTransportWidgets()) {
            incidents.add(incident("transport-delay", "Transport delay incident", "Delayed transports are grouped here before escalation or reassignment.", delayedTransports, "error", transportOrdersRoute(profile, "IN_TRANSIT"), "Resolve delays"));
        }
        if (blockedTasks > 0 && profile.showTaskWidgets()) {
            incidents.add(incident("blocked-work", "Blocked workflow incident", "Blocked tasks indicate a stuck operational workflow.", blockedTasks, "error", tasksRoute(profile, "BLOCKED"), "Unblock tasks"));
        }
        if (overdueTasks > 0 && profile.showTaskWidgets()) {
            incidents.add(incident("sla-risk", "SLA deadline risk", "Overdue tasks are grouped as SLA risk until completed or rescheduled.", overdueTasks, "warning", tasksRoute(profile, null), "Review deadlines"));
        }
        if (lowStockCount > 0 && profile.showWarehouseWidgets()) {
            incidents.add(incident("stock-pressure", "Stock pressure incident", "Low stock rows are grouped as inventory pressure.", lowStockCount, "warning", inventoryRoute(profile, null, "LOW_STOCK"), "Replenish stock"));
        }
        if (congestedWarehouses > 0 && profile.showWarehouseWidgets()) {
            incidents.add(incident("warehouse-congestion", "Warehouse congestion incident", "Warehouses above safe capacity usage require movement or capacity review.", congestedWarehouses, "warning", warehousesRoute(profile), "Open warehouses"));
        }
        return incidents;
    }

    private List<OperationalDashboardResponse.OperationalWorkloadResponse> buildWorkload(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now) {
        if (!profile.showTaskWidgets()) {
            return List.of();
        }
        long open = profile.isPersonal()
                ? taskRepository.countByAssignedEmployee_User_IdAndStatusIn(userId, OPEN_TASK_STATUSES)
                : profile == RoleProfile.WAREHOUSE_MANAGER
                ? (managedWarehouseIds.isEmpty() ? 0 : taskRepository.countForManagedWarehousesAndStatusIn(companyId, managedWarehouseIds, OPEN_TASK_STATUSES))
                : companyId == null
                ? taskRepository.countByStatusIn(OPEN_TASK_STATUSES)
                : taskRepository.countByAssignedEmployee_Company_IdAndStatusIn(companyId, OPEN_TASK_STATUSES);
        long blocked = countBlockedTasks(profile, companyId, userId, managedWarehouseIds);
        long overdue = countOverdueTasks(profile, companyId, userId, managedWarehouseIds, now);
        String severity = blocked > 0 ? "error" : overdue > 0 ? "warning" : open > 0 ? "info" : "success";
        String title = profile.isPersonal() ? "My workload" : profile == RoleProfile.WAREHOUSE_MANAGER ? "Managed warehouse workload" : "Operational workload";
        String description = open + " open, " + blocked + " blocked, " + overdue + " overdue task(s).";
        return List.of(new OperationalDashboardResponse.OperationalWorkloadResponse("task-workload", title, description, open, blocked, overdue, severity, tasksRoute(profile, null)));
    }

    private List<OperationalDashboardResponse.OperationalWarehouseCongestionResponse> buildWarehouseCongestion(RoleProfile profile, Long companyId, Set<Long> managedWarehouseIds) {
        if (!profile.showWarehouseWidgets()) {
            return List.of();
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER && managedWarehouseIds.isEmpty()) {
            return List.of();
        }

        boolean restrictWarehouseIds = profile == RoleProfile.WAREHOUSE_MANAGER;
        Set<Long> warehouseIds = restrictWarehouseIds ? managedWarehouseIds : Set.of(-1L);

        return warehouseRepository.findWarehouseCongestionRows(companyId, warehouseIds, restrictWarehouseIds).stream()
                .map(row -> {
                    Long warehouseId = ((Number) row[0]).longValue();
                    String warehouseName = row[1] == null ? null : row[1].toString();
                    BigDecimal capacity = row[2] instanceof BigDecimal value ? value : BigDecimal.ZERO;
                    BigDecimal used = row[3] instanceof BigDecimal value ? value : BigDecimal.ZERO;
                    long rows = row[4] == null ? 0L : ((Number) row[4]).longValue();
                    BigDecimal percent = capacity.compareTo(BigDecimal.ZERO) <= 0
                            ? BigDecimal.ZERO
                            : used.multiply(BigDecimal.valueOf(100)).divide(capacity, 1, RoundingMode.HALF_UP);
                    String severity = percent.compareTo(BigDecimal.valueOf(95)) >= 0 ? "error" : percent.compareTo(BigDecimal.valueOf(80)) >= 0 ? "warning" : "success";
                    return new OperationalDashboardResponse.OperationalWarehouseCongestionResponse(warehouseId, safe(warehouseName, "Warehouse #" + warehouseId), rows, percent.toPlainString(), severity, "/warehouses/" + warehouseId);
                })
                .filter(item -> !"success".equals(item.severity()))
                .limit(6)
                .toList();
    }

    private OperationalDashboardResponse.OperationalSlaResponse buildSla(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now, long overdueTasks, long delayedTransports) {
        LocalDateTime soon = now.plusHours(6);
        long dueSoonTasks;
        if (!profile.showTaskWidgets()) {
            dueSoonTasks = 0;
        } else if (profile.isPersonal()) {
            dueSoonTasks = taskRepository.countByAssignedEmployee_User_IdAndDueDateBetweenAndStatusIn(userId, now, soon, OPEN_TASK_STATUSES);
        } else if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            dueSoonTasks = managedWarehouseIds.isEmpty() ? 0 : taskRepository.countForManagedWarehousesAndDueDateBetweenAndStatusIn(companyId, managedWarehouseIds, now, soon, OPEN_TASK_STATUSES);
        } else {
            dueSoonTasks = companyId == null
                    ? taskRepository.countByDueDateBetweenAndStatusIn(now, soon, OPEN_TASK_STATUSES)
                    : taskRepository.countByAssignedEmployee_Company_IdAndDueDateBetweenAndStatusIn(companyId, now, soon, OPEN_TASK_STATUSES);
        }
        long dueSoonTransports = countDueSoonTransports(profile, companyId, userId, managedWarehouseIds, now, soon);
        String severity = delayedTransports > 0 || overdueTasks > 0 ? "error" : dueSoonTasks > 0 || dueSoonTransports > 0 ? "warning" : "success";
        return new OperationalDashboardResponse.OperationalSlaResponse(overdueTasks, delayedTransports, dueSoonTasks, dueSoonTransports, severity);
    }

    private long countDueSoonTransports(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now, LocalDateTime soon) {
        if (profile == RoleProfile.DRIVER) {
            return transportOrderRepository.countByAssignedEmployee_User_IdAndPlannedArrivalTimeBetweenAndStatusIn(userId, now, soon, ACTIVE_TRANSPORT_STATUSES);
        }
        if (!profile.showTransportWidgets()) {
            return 0;
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : transportOrderRepository.countByCompanyIdAndWarehouseIdsAndPlannedArrivalTimeBetweenAndStatusIn(companyId, managedWarehouseIds, now, soon, ACTIVE_TRANSPORT_STATUSES);
        }
        return companyId == null
                ? transportOrderRepository.countByPlannedArrivalTimeBetweenAndStatusIn(now, soon, ACTIVE_TRANSPORT_STATUSES)
                : transportOrderRepository.countByCreatedBy_Company_IdAndPlannedArrivalTimeBetweenAndStatusIn(companyId, now, soon, ACTIVE_TRANSPORT_STATUSES);
    }

    private OperationalDashboardResponse.OperationalLiveAlertResponse liveAlert(String key, String title, String message, String severity, String route, String actionLabel, LocalDateTime detectedAt) {
        return new OperationalDashboardResponse.OperationalLiveAlertResponse(key, title, message, severity, route, actionLabel, detectedAt);
    }

    private OperationalDashboardResponse.OperationalIncidentResponse incident(String key, String title, String description, long count, String severity, String route, String actionLabel) {
        return new OperationalDashboardResponse.OperationalIncidentResponse(key, title, description, count, severity, route, actionLabel);
    }

    private List<OperationalDashboardResponse.OperationalNextActionResponse> buildNextActions(RoleProfile profile) {
        return switch (profile) {
            case OVERLORD -> List.of(
                    nextAction("review-companies", "Review company health", "Open company administration when global metrics or activity indicate an issue.", "/companies", "Open companies", "high"),
                    nextAction("review-audit", "Review system audit trail", "Check system-level activity logs for sensitive or unusual changes.", "/activity-logs", "Open activity logs", "medium"),
                    nextAction("review-lifecycle", "Monitor lifecycle exceptions", "Use lifecycle monitoring to detect stuck tasks, delayed transports and stale resources.", "/dashboard", "Review monitoring", "medium")
            );
            case COMPANY_ADMIN -> List.of(
                    nextAction("review-operations", "Review company operational exceptions", "Start from delayed transports, blocked tasks, low stock and fleet utilization before opening CRUD screens.", "/dashboard", "Review exceptions", "high"),
                    nextAction("open-transport", "Open active transport flow", "Check active and delayed transport orders before creating new work.", "/transport-orders", "Open transports", "medium"),
                    nextAction("open-inventory", "Review stock pressure", "Resolve low stock rows and inventory availability before planning new operations.", "/inventory?status=LOW_STOCK", "Review inventory", "medium")
            );
            case WAREHOUSE_MANAGER -> List.of(
                    nextAction("review-low-stock", "Review low stock alerts", "Resolve stock pressure in managed warehouses before accepting more warehouse work.", "/inventory?status=LOW_STOCK", "Review inventory", "high"),
                    nextAction("review-warehouse-tasks", "Review blocked warehouse tasks", "Unblock warehouse work and overdue picking/loading tasks.", "/tasks?status=BLOCKED", "Open tasks", "high"),
                    nextAction("open-movements", "Review recent movement activity", "Check whether recent stock movement activity matches the expected warehouse flow.", "/stock-movements", "Open movements", "medium")
            );
            case DISPATCHER -> List.of(
                    nextAction("review-delayed-transport", "Review delayed transports", "Start with transports past planned arrival before creating new dispatch work.", "/transport-orders?status=IN_TRANSIT", "Open delayed transports", "high"),
                    nextAction("review-blocked-transport-tasks", "Review blocked transport tasks", "Resolve blocked transport tasks that can stop loading, departure or delivery.", "/tasks?status=BLOCKED", "Open blocked tasks", "high"),
                    nextAction("open-fleet", "Check fleet availability", "Validate available vehicles before assigning new transport orders.", "/vehicles", "Open fleet", "medium")
            );
            case DRIVER -> List.of(
                    nextAction("open-my-transports", "Open my active transports", "Continue assigned transports and update lifecycle status from the transport details screen.", "/transport-orders?assignedToMe=true", "Open my transports", "high"),
                    nextAction("open-my-tasks", "Open my transport tasks", "Handle assigned loading, transport or delivery tasks by priority and due date.", "/tasks?assignedToMe=true", "Open my tasks", "high"),
                    nextAction("open-my-shifts", "Check my shift", "Confirm current or next shift before starting operational work.", "/my-shifts", "Open shifts", "medium")
            );
            case WORKER -> List.of(
                    nextAction("open-my-tasks", "Open my warehouse tasks", "Work from assigned tasks first; blocked or overdue tasks need priority handling.", "/tasks?assignedToMe=true", "Open my tasks", "high"),
                    nextAction("open-my-shifts", "Check my shift", "Confirm current or next shift before accepting new warehouse work.", "/my-shifts", "Open shifts", "medium"),
                    nextAction("open-notifications", "Review operational notifications", "Check notifications for task assignment, status changes and warehouse updates.", "/notifications", "Open notifications", "medium")
            );
            case HR_MANAGER -> List.of(
                    nextAction("review-employee-coverage", "Review employee coverage", "Check employees without active or planned shifts and resolve staffing gaps.", "/shifts", "Open shifts", "high"),
                    nextAction("review-hr-tasks", "Review HR task workload", "Use task status distribution to find blocked or overdue employee-related work.", "/tasks", "Open tasks", "medium"),
                    nextAction("open-employee-report", "Open employee task report", "Review workload and task distribution by employee.", "/reports/employee-tasks", "Open report", "medium")
            );
            case READ_ONLY -> List.of();
        };
    }

    private OperationalDashboardResponse.OperationalNextActionResponse nextAction(String key, String title, String description, String route, String actionLabel, String priority) {
        return new OperationalDashboardResponse.OperationalNextActionResponse(key, title, description, route, actionLabel, priority);
    }

    private List<OperationalDashboardResponse.OperationalFlowResponse> buildRoleAwareFlows(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now) {
        PageRequest topFive = PageRequest.of(0, 5);

        List<TransportOrder> transportFlows = switch (profile) {
            case OVERLORD, COMPANY_ADMIN -> transportOrderRepository.findTopOperationalTransports(companyId, ACTIVE_TRANSPORT_STATUSES, topFive);
            case DISPATCHER -> transportOrderRepository.findTopOperationalTransports(companyId, ACTIVE_TRANSPORT_STATUSES, topFive);
            case DRIVER -> transportOrderRepository.findTopOperationalTransportsForDriver(userId, ACTIVE_TRANSPORT_STATUSES, topFive);
            case WAREHOUSE_MANAGER -> managedWarehouseIds.isEmpty()
                    ? List.of()
                    : transportOrderRepository.findTopOperationalTransportsForWarehouses(companyId, managedWarehouseIds, ACTIVE_TRANSPORT_STATUSES, topFive);
            default -> List.of();
        };

        List<Task> taskFlows = switch (profile) {
            case OVERLORD, COMPANY_ADMIN -> taskRepository.findTopOperationalProblemTasks(companyId, now, OPEN_TASK_STATUSES, topFive);
            case DISPATCHER -> taskRepository.findTopOperationalTransportProblemTasks(companyId, now, OPEN_TASK_STATUSES, topFive);
            case WAREHOUSE_MANAGER -> managedWarehouseIds.isEmpty()
                    ? List.of()
                    : taskRepository.findTopOperationalProblemTasksForManagedWarehouses(companyId, managedWarehouseIds, now, OPEN_TASK_STATUSES, topFive);
            case DRIVER, WORKER -> taskRepository.findTopOperationalProblemTasksForUser(userId, now, OPEN_TASK_STATUSES, topFive);
            case HR_MANAGER -> taskRepository.findTopOperationalProblemTasks(companyId, now, OPEN_TASK_STATUSES, topFive);
            default -> List.of();
        };

        List<WarehouseInventory> inventoryFlows = switch (profile) {
            case OVERLORD, COMPANY_ADMIN -> warehouseInventoryRepository.findTopOperationalLowStockRows(companyId, topFive);
            case WAREHOUSE_MANAGER -> managedWarehouseIds.isEmpty()
                    ? List.of()
                    : warehouseInventoryRepository.findTopLowStockRowsByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId, topFive);
            default -> List.of();
        };

        return Stream.of(
                        transportFlows.stream().map(order -> transportFlow(order, now)),
                        taskFlows.stream().map(task -> taskFlow(task, profile)),
                        inventoryFlows.stream().map(this::lowStockFlow)
                )
                .flatMap(stream -> stream)
                .filter(Objects::nonNull)
                .limit(10)
                .toList();
    }

    private OperationalDashboardResponse.OperationalFlowResponse transportFlow(TransportOrder order, LocalDateTime now) {
        boolean delayed = order.getPlannedArrivalTime() != null && order.getPlannedArrivalTime().isBefore(now);
        return flow(
                "transport-" + order.getId(),
                "Transport " + safe(order.getOrderNumber(), "#" + order.getId()),
                delayed ? "Delayed transport order requires dispatch review." : "Active transport order in operational flow.",
                "TRANSPORT_ORDER",
                order.getId(),
                "/transport-orders/" + order.getId(),
                order.getStatus().name(),
                delayed ? "error" : "info",
                order.getPlannedArrivalTime()
        );
    }

    private OperationalDashboardResponse.OperationalFlowResponse taskFlow(Task task, RoleProfile profile) {
        String description = task.getStatus() == TaskStatus.BLOCKED
                ? (profile == RoleProfile.DISPATCHER ? "Blocked transport task requires dispatch recovery." : "Blocked task requires recovery action.")
                : "Overdue task requires operational follow-up.";
        return flow(
                "task-" + task.getId(),
                safe(task.getTitle(), "Task #" + task.getId()),
                description,
                "TASK",
                task.getId(),
                "/tasks/" + task.getId(),
                task.getStatus().name(),
                task.getStatus() == TaskStatus.BLOCKED ? "error" : "warning",
                task.getDueDate()
        );
    }

    private OperationalDashboardResponse.OperationalFlowResponse lowStockFlow(WarehouseInventory inventory) {
        Long warehouseId = inventory.getWarehouse() == null ? null : inventory.getWarehouse().getId();
        String warehouseName = inventory.getWarehouse() == null ? "Warehouse" : safe(inventory.getWarehouse().getName(), "Warehouse #" + warehouseId);
        String productName = inventory.getProduct() == null ? "Product" : safe(inventory.getProduct().getName(), "Product #" + inventory.getProduct().getId());
        return flow(
                "low-stock-" + warehouseId + "-" + (inventory.getProduct() == null ? "product" : inventory.getProduct().getId()),
                "Low stock " + productName,
                warehouseName + " inventory is at or below minimum stock level.",
                "WAREHOUSE_INVENTORY",
                warehouseId,
                inventoryRoute(RoleProfile.WAREHOUSE_MANAGER, warehouseId, "LOW_STOCK"),
                "LOW_STOCK",
                "warning",
                null
        );
    }

    private String operationalTitle(RoleProfile profile) {
        return switch (profile) {
            case OVERLORD -> "Global operational command board";
            case COMPANY_ADMIN -> "Company operational command board";
            case WAREHOUSE_MANAGER -> "Warehouse operational board";
            case DISPATCHER -> "Dispatch operational board";
            case DRIVER -> "My transport work board";
            case WORKER -> "My warehouse work board";
            case HR_MANAGER -> "HR task board";
            case READ_ONLY -> "Operational board";
        };
    }

    private String operationalDescription(RoleProfile profile) {
        return switch (profile) {
            case OVERLORD -> "Global warehouse, transport, fleet, task and movement signals across the system.";
            case COMPANY_ADMIN -> "Company-level operational signals across warehouses, transport, fleet, tasks and movement activity.";
            case WAREHOUSE_MANAGER -> "Warehouse stock pressure, blocked warehouse work and recent stock movement activity.";
            case DISPATCHER -> "Transport delays, active transport flow, fleet usage and blocked transport work.";
            case DRIVER -> "Your assigned transports and task exceptions that require attention.";
            case WORKER -> "Your assigned warehouse tasks that are blocked or overdue.";
            case HR_MANAGER -> "Task lifecycle signals relevant for employee workload follow-up.";
            case READ_ONLY -> "Operational signals available for the current role.";
        };
    }

    private String operationalEmptyMessage(RoleProfile profile) {
        return switch (profile) {
            case DRIVER -> "No personal transport or task exceptions require attention.";
            case WORKER -> "No personal warehouse task exceptions require attention.";
            case WAREHOUSE_MANAGER -> "No warehouse operational exceptions require attention.";
            case DISPATCHER -> "No dispatch operational exceptions require attention.";
            case HR_MANAGER -> "No HR task exceptions require attention.";
            default -> "No active operational exceptions require attention.";
        };
    }

    private Set<Long> resolveManagedWarehouseIds(RoleProfile profile, Long companyId, Employee employee) {
        if (profile != RoleProfile.WAREHOUSE_MANAGER || companyId == null || employee == null || employee.getId() == null) {
            return Set.of();
        }
        return warehouseRepository.findByManagerIdAndCompany_Id(employee.getId(), companyId).stream()
                .map(Warehouse::getId)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private long countLowStock(RoleProfile profile, Long companyId, Set<Long> managedWarehouseIds) {
        if (!profile.showWarehouseWidgets()) {
            return 0;
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : warehouseInventoryRepository.countLowStockRowsByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId);
        }
        return companyId == null
                ? warehouseInventoryRepository.countLowStockRows()
                : warehouseInventoryRepository.countLowStockRowsByCompanyId(companyId);
    }

    private long countRecentMovementActivity(RoleProfile profile, Long companyId, Set<Long> managedWarehouseIds, LocalDateTime now) {
        if (!profile.showMovementWidgets()) {
            return 0;
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : stockMovementRepository.countByCompanyIdAndWarehouseIdsAndCreatedAtAfter(companyId, managedWarehouseIds, now.minusDays(1));
        }
        return companyId == null
                ? stockMovementRepository.countByCreatedAtAfter(now.minusDays(1))
                : stockMovementRepository.countByWarehouse_Company_IdAndCreatedAtAfter(companyId, now.minusDays(1));
    }

    private List<OperationalDashboardResponse.OperationalWidgetResponse> buildWidgets(
            RoleProfile profile,
            long congestedWarehouses,
            long lowStockCount,
            long delayedTransports,
            long activeTransports,
            long blockedTasks,
            long overdueTasks,
            long occupiedVehicles,
            long vehiclesTotal,
            long recentMovementActivity
    ) {
        List<OperationalDashboardResponse.OperationalWidgetResponse> widgets = new ArrayList<>();

        if (profile.showWarehouseWidgets()) {
            widgets.add(widget("warehouseCongestion", "Warehouse congestion", "Warehouse congestion calculation is deferred to keep pages responsive.", congestedWarehouses, "neutral", warehousesRoute(profile), "Open warehouses"));
            widgets.add(widget("lowStock", "Low stock alerts", "Inventory rows at or below minimum stock level.", lowStockCount, lowStockCount == 0 ? "success" : "error", inventoryRoute(profile, null, "LOW_STOCK"), "Review inventory"));
        }

        if (profile.showMovementWidgets()) {
            widgets.add(widget("movementActivity", "Movement activity", "Stock movements created during the last 24 hours.", recentMovementActivity, recentMovementActivity > 0 ? "info" : "neutral", stockMovementsRoute(profile), "Open movements"));
        }

        if (profile.showTransportWidgets()) {
            widgets.add(widget("delayedTransport", profile == RoleProfile.DRIVER ? "My delayed transports" : "Delayed transports", "Active transport orders past planned arrival time.", delayedTransports, delayedTransports > 0 ? "error" : "success", transportOrdersRoute(profile, "IN_TRANSIT"), "Open transports"));
            widgets.add(widget("activeTransports", profile == RoleProfile.DRIVER ? "My active transports" : "Active transports", "Transport orders currently in an active operational state.", activeTransports, activeTransports > 0 ? "info" : "neutral", transportOrdersRoute(profile, null), "Open transports"));
        }

        if (profile.showFleetWidgets()) {
            widgets.add(widget("vehicleUtilization", "Vehicle utilization", "Vehicles reserved or currently in use.", occupiedVehicles, vehiclesTotal == 0 ? "neutral" : "info", vehiclesRoute(profile), "Open fleet"));
        }

        if (profile.showTaskWidgets()) {
            widgets.add(widget("blockedTasks", profile.isPersonal() ? "My blocked tasks" : "Blocked tasks", "Operational tasks waiting for recovery or unblock action.", blockedTasks, blockedTasks > 0 ? "error" : "success", tasksRoute(profile, "BLOCKED"), "Open tasks"));
            widgets.add(widget("overdueTasks", profile.isPersonal() ? "My overdue tasks" : "Overdue tasks", "Open tasks already past their due date.", overdueTasks, overdueTasks > 0 ? "warning" : "success", tasksRoute(profile, null), "Open tasks"));
        }

        return widgets;
    }

    private long countDelayedTransports(RoleProfile profile, Long companyId, Long userId, LocalDateTime now) {
        if (profile == RoleProfile.DRIVER) {
            return transportOrderRepository.countByAssignedEmployee_User_IdAndPlannedArrivalTimeBeforeAndStatusIn(userId, now, ACTIVE_TRANSPORT_STATUSES);
        }
        if (!profile.showTransportWidgets()) {
            return 0;
        }
        return companyId == null
                ? transportOrderRepository.countByPlannedArrivalTimeBeforeAndStatusIn(now, ACTIVE_TRANSPORT_STATUSES)
                : transportOrderRepository.countByCreatedBy_Company_IdAndPlannedArrivalTimeBeforeAndStatusIn(companyId, now, ACTIVE_TRANSPORT_STATUSES);
    }

    private long countActiveTransports(RoleProfile profile, Long companyId, Long userId) {
        if (profile == RoleProfile.DRIVER) {
            return transportOrderRepository.countByAssignedEmployee_User_IdAndStatusIn(userId, ACTIVE_TRANSPORT_STATUSES);
        }
        if (!profile.showTransportWidgets()) {
            return 0;
        }
        return companyId == null
                ? transportOrderRepository.countByStatusIn(ACTIVE_TRANSPORT_STATUSES)
                : transportOrderRepository.countByCreatedBy_Company_IdAndStatusIn(companyId, ACTIVE_TRANSPORT_STATUSES);
    }

    private long countBlockedTasks(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds) {
        if (profile.isPersonal()) {
            return taskRepository.countByAssignedEmployee_User_IdAndStatus(userId, TaskStatus.BLOCKED);
        }
        if (!profile.showTaskWidgets()) {
            return 0;
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : taskRepository.countForManagedWarehousesAndStatusIn(companyId, managedWarehouseIds, List.of(TaskStatus.BLOCKED));
        }
        return companyId == null
                ? taskRepository.countByStatus(TaskStatus.BLOCKED)
                : taskRepository.countByAssignedEmployee_Company_IdAndStatus(companyId, TaskStatus.BLOCKED);
    }

    private long countOverdueTasks(RoleProfile profile, Long companyId, Long userId, Set<Long> managedWarehouseIds, LocalDateTime now) {
        if (profile.isPersonal()) {
            return taskRepository.countByAssignedEmployee_User_IdAndDueDateBeforeAndStatusIn(userId, now, OPEN_TASK_STATUSES);
        }
        if (!profile.showTaskWidgets()) {
            return 0;
        }
        if (profile == RoleProfile.WAREHOUSE_MANAGER) {
            return managedWarehouseIds.isEmpty() ? 0 : taskRepository.countForManagedWarehousesAndDueDateBeforeAndStatusIn(companyId, managedWarehouseIds, now, OPEN_TASK_STATUSES);
        }
        return companyId == null
                ? taskRepository.countByDueDateBeforeAndStatusIn(now, OPEN_TASK_STATUSES)
                : taskRepository.countByAssignedEmployee_Company_IdAndDueDateBeforeAndStatusIn(companyId, now, OPEN_TASK_STATUSES);
    }

    private String warehousesRoute(RoleProfile profile) {
        return switch (profile) {
            case OVERLORD, COMPANY_ADMIN, WAREHOUSE_MANAGER, DISPATCHER -> "/warehouses";
            default -> null;
        };
    }

    private String inventoryRoute(RoleProfile profile, Long warehouseId, String status) {
        if (!(profile == RoleProfile.OVERLORD || profile == RoleProfile.COMPANY_ADMIN || profile == RoleProfile.WAREHOUSE_MANAGER || profile == RoleProfile.DISPATCHER)) {
            return null;
        }
        List<String> params = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            params.add("status=" + status);
        }
        if (warehouseId != null) {
            params.add("warehouseId=" + warehouseId);
        }
        return params.isEmpty() ? "/inventory" : "/inventory?" + String.join("&", params);
    }

    private String stockMovementsRoute(RoleProfile profile) {
        return switch (profile) {
            case OVERLORD, COMPANY_ADMIN, WAREHOUSE_MANAGER, DISPATCHER -> "/stock-movements";
            default -> null;
        };
    }

    private String transportOrdersRoute(RoleProfile profile, String status) {
        if (!(profile == RoleProfile.OVERLORD || profile == RoleProfile.COMPANY_ADMIN || profile == RoleProfile.DISPATCHER || profile == RoleProfile.WAREHOUSE_MANAGER || profile == RoleProfile.DRIVER)) {
            return null;
        }
        List<String> params = new ArrayList<>();
        if (profile == RoleProfile.DRIVER) {
            params.add("assignedToMe=true");
        }
        if (status != null && !status.isBlank()) {
            params.add("status=" + status);
        }
        return params.isEmpty() ? "/transport-orders" : "/transport-orders?" + String.join("&", params);
    }

    private String vehiclesRoute(RoleProfile profile) {
        return switch (profile) {
            case OVERLORD, COMPANY_ADMIN, DISPATCHER -> "/vehicles";
            default -> null;
        };
    }

    private String tasksRoute(RoleProfile profile, String status) {
        if (!(profile == RoleProfile.OVERLORD || profile == RoleProfile.COMPANY_ADMIN || profile == RoleProfile.HR_MANAGER || profile == RoleProfile.WAREHOUSE_MANAGER || profile == RoleProfile.DISPATCHER || profile == RoleProfile.DRIVER || profile == RoleProfile.WORKER)) {
            return null;
        }
        List<String> params = new ArrayList<>();
        if (profile.isPersonal()) {
            params.add("assignedToMe=true");
        }
        if (status != null && !status.isBlank()) {
            params.add("status=" + status);
        }
        return params.isEmpty() ? "/tasks" : "/tasks?" + String.join("&", params);
    }

    private OperationalDashboardResponse.OperationalWidgetResponse widget(String key, String title, String description, long value, String severity, String route, String actionLabel) {
        return new OperationalDashboardResponse.OperationalWidgetResponse(key, title, description, value, severity, route, actionLabel);
    }

    private OperationalDashboardResponse.OperationalFlowResponse flow(String key, String title, String description, String entityType, Long entityId, String route, String status, String severity, LocalDateTime dueAt) {
        return new OperationalDashboardResponse.OperationalFlowResponse(key, title, description, entityType, entityId, route, status, severity, dueAt);
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
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

        boolean showWarehouseWidgets() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == WAREHOUSE_MANAGER;
        }

        boolean showMovementWidgets() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == WAREHOUSE_MANAGER;
        }

        boolean showTransportWidgets() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == DISPATCHER || this == DRIVER;
        }

        boolean showFleetWidgets() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == DISPATCHER;
        }

        boolean showTaskWidgets() {
            return this == OVERLORD || this == COMPANY_ADMIN || this == WAREHOUSE_MANAGER || this == DISPATCHER || this == DRIVER || this == WORKER || this == HR_MANAGER;
        }

        boolean isPersonal() {
            return this == DRIVER || this == WORKER;
        }
    }
}
