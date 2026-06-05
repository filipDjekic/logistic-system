package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationSourceType;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LifecycleNotificationService {

    private static final String ROLE_COMPANY_ADMIN = "COMPANY_ADMIN";
    private static final String ROLE_DISPATCHER = "DISPATCHER";

    private final NotificationServiceDefinition notificationService;
    private final UserRepository userRepository;

    public void notifyTaskAssigned(Task task, Employee oldAssignee, Employee newAssignee) {
        if (task == null || newAssignee == null) {
            return;
        }

        Set<Long> notifiedUserIds = new HashSet<>();
        Long sourceId = task.getId();

        if (oldAssignee != null
                && newAssignee.getId() != null
                && !Objects.equals(oldAssignee.getId(), newAssignee.getId())) {
            notifyUser(
                    notifiedUserIds,
                    userId(oldAssignee),
                    "Task reassigned",
                    "Task '" + task.getTitle() + "' is no longer assigned to you.",
                    NotificationType.WARNING,
                    NotificationSeverity.WARNING,
                    NotificationCategory.TASK,
                    NotificationSourceType.TASK,
                    sourceId,
                    "TASK:" + sourceId + ":REASSIGNED_FROM:" + employeeId(oldAssignee)
            );
        }

        notifyUser(
                notifiedUserIds,
                userId(newAssignee),
                "Task assigned",
                "Task '" + task.getTitle() + "' has been assigned to you.",
                NotificationType.INFO,
                NotificationSeverity.INFO,
                NotificationCategory.TASK,
                NotificationSourceType.TASK,
                sourceId,
                "TASK:" + sourceId + ":ASSIGNED_TO:" + employeeId(newAssignee)
        );
    }

    public void notifyTaskStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus, String reason) {
        if (task == null || oldStatus == newStatus) {
            return;
        }

        Set<Long> notifiedUserIds = new HashSet<>();
        NotificationType type = warningTaskStatus(newStatus) ? NotificationType.WARNING : NotificationType.INFO;
        NotificationSeverity severity = warningTaskStatus(newStatus) ? NotificationSeverity.WARNING : NotificationSeverity.INFO;
        String reasonSuffix = reason == null || reason.isBlank() ? "" : " Reason: " + reason.trim();

        notifyUser(
                notifiedUserIds,
                userId(task.getAssignedEmployee()),
                "Task status updated",
                "Task '" + task.getTitle() + "' changed from " + oldStatus + " to " + newStatus + "." + reasonSuffix,
                type,
                severity,
                NotificationCategory.TASK,
                NotificationSourceType.TASK,
                task.getId(),
                "TASK:" + task.getId() + ":STATUS:" + newStatus
        );

        if (newStatus == TaskStatus.BLOCKED || newStatus == TaskStatus.CANCELLED) {
            notifyTaskEscalationStakeholders(notifiedUserIds, task, newStatus, reasonSuffix, type, severity);
        }
    }

    public void notifyTransportStatusChanged(TransportOrder transportOrder,
                                             TransportOrderStatus oldStatus,
                                             TransportOrderStatus newStatus,
                                             String reason) {
        if (transportOrder == null || oldStatus == newStatus) {
            return;
        }

        Set<Long> notifiedUserIds = new HashSet<>();
        NotificationType type = warningTransportStatus(newStatus) ? NotificationType.WARNING : NotificationType.INFO;
        NotificationSeverity severity = warningTransportStatus(newStatus) ? NotificationSeverity.WARNING : NotificationSeverity.INFO;
        String orderRef = transportReference(transportOrder);
        String reasonSuffix = reason == null || reason.isBlank() ? "" : " Reason: " + reason.trim();
        String message = "Transport " + orderRef + " changed from " + oldStatus + " to " + newStatus + "." + reasonSuffix;

        notifyUser(
                notifiedUserIds,
                userId(transportOrder.getAssignedEmployee()),
                transportTitle(newStatus),
                message,
                type,
                severity,
                NotificationCategory.TRANSPORT,
                NotificationSourceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                "TRANSPORT:" + transportOrder.getId() + ":STATUS:" + newStatus + ":DRIVER"
        );

        notifyUser(
                notifiedUserIds,
                userId(transportOrder.getSourceWarehouse() != null ? transportOrder.getSourceWarehouse().getManager() : null),
                transportTitle(newStatus),
                message,
                type,
                severity,
                NotificationCategory.TRANSPORT,
                NotificationSourceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                "TRANSPORT:" + transportOrder.getId() + ":STATUS:" + newStatus + ":SOURCE_MANAGER"
        );

        notifyUser(
                notifiedUserIds,
                userId(transportOrder.getDestinationWarehouse() != null ? transportOrder.getDestinationWarehouse().getManager() : null),
                transportTitle(newStatus),
                message,
                type,
                severity,
                NotificationCategory.TRANSPORT,
                NotificationSourceType.TRANSPORT_ORDER,
                transportOrder.getId(),
                "TRANSPORT:" + transportOrder.getId() + ":STATUS:" + newStatus + ":DESTINATION_MANAGER"
        );

        Long companyId = companyId(transportOrder);
        if (companyId != null) {
            notifyRoleUsers(notifiedUserIds, companyId, ROLE_DISPATCHER, transportTitle(newStatus), message, type, severity,
                    NotificationCategory.TRANSPORT, NotificationSourceType.TRANSPORT_ORDER, transportOrder.getId(),
                    "TRANSPORT:" + transportOrder.getId() + ":STATUS:" + newStatus + ":DISPATCHER");

            if (newStatus == TransportOrderStatus.FAILED
                    || newStatus == TransportOrderStatus.CANCELLED
                    || newStatus == TransportOrderStatus.RESCHEDULED) {
                notifyRoleUsers(notifiedUserIds, companyId, ROLE_COMPANY_ADMIN, transportTitle(newStatus), message, type, severity,
                        NotificationCategory.TRANSPORT, NotificationSourceType.TRANSPORT_ORDER, transportOrder.getId(),
                        "TRANSPORT:" + transportOrder.getId() + ":STATUS:" + newStatus + ":COMPANY_ADMIN");
            }
        }
    }

    public void notifyStockMovementCreated(StockMovement stockMovement) {
        if (stockMovement == null) {
            return;
        }

        Set<Long> notifiedUserIds = new HashSet<>();
        NotificationSeverity severity = warningStockMovement(stockMovement) ? NotificationSeverity.WARNING : NotificationSeverity.INFO;
        NotificationType type = warningStockMovement(stockMovement) ? NotificationType.WARNING : NotificationType.INFO;
        String reference = stockMovement.getReferenceNumber() != null && !stockMovement.getReferenceNumber().isBlank()
                ? stockMovement.getReferenceNumber()
                : "#" + stockMovement.getId();
        String productName = stockMovement.getProduct() != null ? stockMovement.getProduct().getName() : "product";
        String warehouseName = stockMovement.getWarehouse() != null ? stockMovement.getWarehouse().getName() : "warehouse";
        String message = "Stock movement " + reference + " recorded " + stockMovement.getMovementType()
                + " of " + stockMovement.getQuantity() + " for " + productName + " in warehouse '" + warehouseName + "'.";

        notifyUser(
                notifiedUserIds,
                userId(stockMovement.getWarehouse() != null ? stockMovement.getWarehouse().getManager() : null),
                "Stock movement recorded",
                message,
                type,
                severity,
                NotificationCategory.INVENTORY,
                NotificationSourceType.STOCK_MOVEMENT,
                stockMovement.getId(),
                "STOCK_MOVEMENT:" + stockMovement.getId() + ":CREATED:WAREHOUSE_MANAGER"
        );

        if (stockMovement.getTransportOrder() != null && warningStockMovement(stockMovement)) {
            notifyUser(
                    notifiedUserIds,
                    userId(stockMovement.getTransportOrder().getAssignedEmployee()),
                    "Transport stock movement issue",
                    message,
                    type,
                    severity,
                    NotificationCategory.INVENTORY,
                    NotificationSourceType.STOCK_MOVEMENT,
                    stockMovement.getId(),
                    "STOCK_MOVEMENT:" + stockMovement.getId() + ":CREATED:DRIVER"
            );
        }

        Long companyId = stockMovement.getWarehouse() != null && stockMovement.getWarehouse().getCompany() != null
                ? stockMovement.getWarehouse().getCompany().getId()
                : null;
        if (companyId != null && warningStockMovement(stockMovement)) {
            notifyRoleUsers(notifiedUserIds, companyId, ROLE_COMPANY_ADMIN,
                    "Inventory movement warning", message, type, severity,
                    NotificationCategory.INVENTORY, NotificationSourceType.STOCK_MOVEMENT, stockMovement.getId(),
                    "STOCK_MOVEMENT:" + stockMovement.getId() + ":CREATED:COMPANY_ADMIN");
        }
    }

    private void notifyTaskEscalationStakeholders(Set<Long> notifiedUserIds,
                                                  Task task,
                                                  TaskStatus newStatus,
                                                  String reasonSuffix,
                                                  NotificationType type,
                                                  NotificationSeverity severity) {
        String message = "Task '" + task.getTitle() + "' is " + newStatus + "." + reasonSuffix;
        Long companyId = companyId(task);

        if (task.getTransportOrder() != null) {
            notifyRoleUsers(notifiedUserIds, companyId, ROLE_DISPATCHER,
                    "Transport task requires attention", message, type, severity,
                    NotificationCategory.TASK, NotificationSourceType.TASK, task.getId(),
                    "TASK:" + task.getId() + ":ESCALATION:" + newStatus + ":DISPATCHER");
        }

        if (task.getStockMovement() != null) {
            notifyUser(notifiedUserIds,
                    userId(task.getStockMovement().getWarehouse() != null ? task.getStockMovement().getWarehouse().getManager() : null),
                    "Warehouse task requires attention", message, type, severity,
                    NotificationCategory.TASK, NotificationSourceType.TASK, task.getId(),
                    "TASK:" + task.getId() + ":ESCALATION:" + newStatus + ":WAREHOUSE_MANAGER");
        }

        if (companyId != null) {
            notifyRoleUsers(notifiedUserIds, companyId, ROLE_COMPANY_ADMIN,
                    "Operational task requires attention", message, type, severity,
                    NotificationCategory.TASK, NotificationSourceType.TASK, task.getId(),
                    "TASK:" + task.getId() + ":ESCALATION:" + newStatus + ":COMPANY_ADMIN");
        }
    }

    private void notifyRoleUsers(Set<Long> notifiedUserIds,
                                 Long companyId,
                                 String roleName,
                                 String title,
                                 String message,
                                 NotificationType type,
                                 NotificationSeverity severity,
                                 NotificationCategory category,
                                 NotificationSourceType sourceType,
                                 Long sourceId,
                                 String dedupPrefix) {
        if (companyId == null) {
            return;
        }
        List<User> users = userRepository.findByCompany_IdAndRole_NameIgnoreCaseAndEnabledTrue(companyId, roleName);
        for (User user : users) {
            if (user.getStatus() == UserStatus.ACTIVE) {
                notifyUser(notifiedUserIds, user.getId(), title, message, type, severity, category, sourceType, sourceId, dedupPrefix + ":" + user.getId());
            }
        }
    }

    private void notifyUser(Set<Long> notifiedUserIds,
                            Long userId,
                            String title,
                            String message,
                            NotificationType type,
                            NotificationSeverity severity,
                            NotificationCategory category,
                            NotificationSourceType sourceType,
                            Long sourceId,
                            String dedupKey) {
        if (userId == null || notifiedUserIds.contains(userId)) {
            return;
        }
        notificationService.createOperationalNotification(userId, title, message, type, severity, category, sourceType, sourceId, dedupKey);
        notifiedUserIds.add(userId);
    }

    private Long userId(Employee employee) {
        return employee != null && employee.getUser() != null ? employee.getUser().getId() : null;
    }

    private Long employeeId(Employee employee) {
        return employee != null ? employee.getId() : null;
    }

    private boolean warningTaskStatus(TaskStatus status) {
        return status == TaskStatus.BLOCKED || status == TaskStatus.CANCELLED;
    }

    private boolean warningTransportStatus(TransportOrderStatus status) {
        return status == TransportOrderStatus.FAILED
                || status == TransportOrderStatus.CANCELLED
                || status == TransportOrderStatus.RESCHEDULED
                || status == TransportOrderStatus.RETURNING;
    }

    private boolean warningStockMovement(StockMovement movement) {
        StockMovementType type = movement.getMovementType();
        StockMovementReasonCode reason = movement.getReasonCode();
        return type == StockMovementType.ADJUSTMENT
                || type == StockMovementType.WRITE_OFF
                || reason == StockMovementReasonCode.DAMAGE_WRITE_OFF
                || reason == StockMovementReasonCode.INVENTORY_ADJUSTMENT
                || reason == StockMovementReasonCode.CORRECTION;
    }

    private String transportTitle(TransportOrderStatus status) {
        return warningTransportStatus(status) ? "Transport requires attention" : "Transport status updated";
    }

    private String transportReference(TransportOrder transportOrder) {
        return transportOrder.getOrderNumber() != null && !transportOrder.getOrderNumber().isBlank()
                ? transportOrder.getOrderNumber()
                : "#" + transportOrder.getId();
    }

    private Long companyId(Task task) {
        if (task.getAssignedEmployee() != null && task.getAssignedEmployee().getCompany() != null) {
            return task.getAssignedEmployee().getCompany().getId();
        }
        if (task.getTransportOrder() != null) {
            return companyId(task.getTransportOrder());
        }
        if (task.getStockMovement() != null && task.getStockMovement().getWarehouse() != null && task.getStockMovement().getWarehouse().getCompany() != null) {
            return task.getStockMovement().getWarehouse().getCompany().getId();
        }
        return null;
    }

    private Long companyId(TransportOrder transportOrder) {
        if (transportOrder.getCreatedBy() != null && transportOrder.getCreatedBy().getCompany() != null) {
            return transportOrder.getCreatedBy().getCompany().getId();
        }
        if (transportOrder.getSourceWarehouse() != null && transportOrder.getSourceWarehouse().getCompany() != null) {
            return transportOrder.getSourceWarehouse().getCompany().getId();
        }
        return null;
    }
}
