package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.*;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.service.definition.NotificationEscalationServiceDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationEscalationService implements NotificationEscalationServiceDefinition {

    private static final String ROLE_COMPANY_ADMIN = "COMPANY_ADMIN";
    private static final Collection<TaskStatus> OPEN_TASK_STATUSES = List.of(TaskStatus.NEW, TaskStatus.IN_PROGRESS);
    private static final Collection<TransportOrderStatus> FAILED_TRANSPORT_STATUSES = List.of(TransportOrderStatus.FAILED, TransportOrderStatus.RETURNING);

    private final NotificationServiceDefinition notificationService;
    private final TaskRepository taskRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final TimeServiceDefinition timeService;

    @Override
    @Transactional
    public void runEscalationSweep() {
        LocalDateTime now = timeService.nowSystem();
        escalateOverdueTasks(now);
        escalateLowStock();
        escalateFailedTransports();
        escalateMissingShiftCoverage(now);
    }

    private void escalateOverdueTasks(LocalDateTime now) {
        for (Task task : taskRepository.findOverdueOpenTasks(now, OPEN_TASK_STATUSES)) {
            Employee employee = task.getAssignedEmployee();
            if (employee == null || employee.getUser() == null) {
                continue;
            }

            notificationService.createOperationalNotification(
                    employee.getUser().getId(),
                    "Overdue task",
                    "Task #" + task.getId() + " is overdue: " + task.getTitle(),
                    NotificationType.WARNING,
                    NotificationSeverity.WARNING,
                    NotificationCategory.TASK,
                    NotificationSourceType.TASK,
                    task.getId(),
                    "TASK_OVERDUE:" + task.getId() + ":" + employee.getUser().getId()
            );

            notifyCompanyAdmins(
                    employee.getCompany(),
                    "Overdue task",
                    "Task #" + task.getId() + " assigned to " + employee.getFirstName() + " " + employee.getLastName() + " is overdue.",
                    NotificationSeverity.WARNING,
                    NotificationCategory.TASK,
                    NotificationSourceType.TASK,
                    task.getId(),
                    "TASK_OVERDUE_ADMIN:" + task.getId()
            );
        }
    }

    private void escalateLowStock() {
        for (WarehouseInventory inventory : warehouseInventoryRepository.findLowStockRows()) {
            Warehouse warehouse = inventory.getWarehouse();
            Product product = inventory.getProduct();
            BigDecimal available = inventory.getAvailableQuantity();
            BigDecimal minimum = inventory.getMinStockLevel();

            Set<User> targets = new LinkedHashSet<>();
            if (warehouse != null && warehouse.getManager() != null && warehouse.getManager().getUser() != null) {
                targets.add(warehouse.getManager().getUser());
            }
            targets.addAll(companyAdmins(warehouse != null ? warehouse.getCompany() : null));

            for (User target : targets) {
                notificationService.createOperationalNotification(
                        target.getId(),
                        "Low stock",
                        "Product " + (product != null ? product.getName() : "#" + inventory.getId().getProductId())
                                + " is at " + available + " available units in "
                                + (warehouse != null ? warehouse.getName() : "warehouse")
                                + ". Minimum: " + minimum + ".",
                        NotificationType.WARNING,
                        available.compareTo(BigDecimal.ZERO) <= 0 ? NotificationSeverity.CRITICAL : NotificationSeverity.WARNING,
                        NotificationCategory.INVENTORY,
                        NotificationSourceType.WAREHOUSE_INVENTORY,
                        inventory.getId().getWarehouseId(),
                        "LOW_STOCK:" + inventory.getId().getWarehouseId() + ":" + inventory.getId().getProductId() + ":" + target.getId()
                );
            }
        }
    }

    private void escalateFailedTransports() {
        for (TransportOrder order : transportOrderRepository.findByStatusInWithNotificationContext(FAILED_TRANSPORT_STATUSES)) {
            Set<User> targets = new LinkedHashSet<>();
            if (order.getCreatedBy() != null) {
                targets.add(order.getCreatedBy());
            }
            if (order.getAssignedEmployee() != null && order.getAssignedEmployee().getUser() != null) {
                targets.add(order.getAssignedEmployee().getUser());
            }
            targets.addAll(companyAdmins(order.getCreatedBy() != null ? order.getCreatedBy().getCompany() : null));

            for (User target : targets) {
                notificationService.createOperationalNotification(
                        target.getId(),
                        "Transport escalation",
                        "Transport #" + order.getId() + " (" + order.getOrderNumber() + ") is in " + order.getStatus() + " status.",
                        NotificationType.ERROR,
                        NotificationSeverity.CRITICAL,
                        NotificationCategory.TRANSPORT,
                        NotificationSourceType.TRANSPORT_ORDER,
                        order.getId(),
                        "TRANSPORT_ESCALATION:" + order.getId() + ":" + order.getStatus() + ":" + target.getId()
                );
            }
        }
    }

    private void escalateMissingShiftCoverage(LocalDateTime now) {
        for (Warehouse warehouse : warehouseRepository.findByStatus(WarehouseStatus.ACTIVE)) {
            Long companyId = warehouse.getCompany() != null ? warehouse.getCompany().getId() : null;
            long activeShiftCount = companyId == null ? 0 : shiftRepository.countActiveForCompany(companyId, now);
            if (activeShiftCount > 0) {
                continue;
            }

            Set<User> targets = new LinkedHashSet<>(companyAdmins(warehouse.getCompany()));
            if (warehouse.getManager() != null && warehouse.getManager().getUser() != null) {
                targets.add(warehouse.getManager().getUser());
            }

            for (User target : targets) {
                notificationService.createOperationalNotification(
                        target.getId(),
                        "Missing shift coverage",
                        "No active shift coverage is currently detected for company warehouse operations. Check warehouse " + warehouse.getName() + ".",
                        NotificationType.WARNING,
                        NotificationSeverity.WARNING,
                        NotificationCategory.SHIFT,
                        NotificationSourceType.WAREHOUSE,
                        warehouse.getId(),
                        "MISSING_SHIFT_COVERAGE:" + warehouse.getId() + ":" + target.getId()
                );
            }
        }
    }

    private List<User> companyAdmins(Company company) {
        if (company == null || company.getId() == null) {
            return List.of();
        }
        return userRepository.findByCompany_IdAndRole_NameIgnoreCaseAndEnabledTrue(company.getId(), ROLE_COMPANY_ADMIN);
    }

    private void notifyCompanyAdmins(Company company,
                                     String title,
                                     String message,
                                     NotificationSeverity severity,
                                     NotificationCategory category,
                                     NotificationSourceType sourceType,
                                     Long sourceId,
                                     String dedupPrefix) {
        for (User admin : companyAdmins(company)) {
            notificationService.createOperationalNotification(
                    admin.getId(),
                    title,
                    message,
                    severity == NotificationSeverity.CRITICAL ? NotificationType.ERROR : NotificationType.WARNING,
                    severity,
                    category,
                    sourceType,
                    sourceId,
                    dedupPrefix + ":" + admin.getId()
            );
        }
    }
}
