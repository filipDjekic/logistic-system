package rs.logistics.logistics_system.service.implementation;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;
import rs.logistics.logistics_system.service.support.DomainScopeValidator;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.response.StatusCountResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TaskType;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionContext;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionEngine;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService implements TaskServiceDefinition {

    private final TaskRepository _taskRepository;
    private final ShiftRepository _shiftRepository;
    private final EmployeeRepository _employeeRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final StockMovementRepository stockMovementRepository;
    private final WarehouseRepository warehouseRepository;
    private final EmployeeWarehouseAssignmentRepository employeeWarehouseAssignmentRepository;

    private final NotificationServiceDefinition notificationService;
    private final AuditFacadeDefinition auditFacade;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final TimeServiceDefinition timeService;
    private final DomainScopeValidator domainScopeValidator;
    private final LifecycleTransitionEngine lifecycleTransitionEngine;
    private final LifecycleNotificationService lifecycleNotificationService;

    @Override
    @Transactional
    public TaskResponse create(TaskCreate dto) {
        validateDueDate(dto.getDueDate());
        normalizeTaskType(dto);

        Employee employee = getActiveEmployee(dto.getAssignedEmployeeId());
        TransportOrder transportOrder = getOptionalTransportOrder(dto.getTransportOrderId());
        StockMovement stockMovement = getOptionalStockMovement(dto.getStockMovementId());

        validateTaskCompanyContext(employee, transportOrder, stockMovement);
        validateLinkedProcessContext(transportOrder, stockMovement);
        validateAssigneeRole(employee, transportOrder, stockMovement, dto.getTaskType());
        validateAssigneeOperationalScope(employee, stockMovement);
        validateEmployeeAvailabilityForTask(employee, dto.getDueDate());
        validateWarehouseManagerMutationScope(transportOrder, dto.getTaskType());

        Task task = TaskMapper.toEntity(dto, employee, transportOrder, stockMovement);
        task.setStatus(TaskStatus.OPEN);
        Task saved = _taskRepository.save(task);

        lifecycleNotificationService.notifyTaskAssigned(saved, null, employee);

        auditFacade.recordCreate("TASK", saved.getId());
        auditFacade.log(
                "CREATE",
                "TASK",
                saved.getId(),
                "TASK is created (ID: " + saved.getId() + ")"
        );

        return TaskMapper.toResponse(saved, timeService);
    }

    @Override
    @Transactional
    public TaskResponse update(Long id, TaskUpdate dto) {
        Task task = getTaskOrThrow(id);

        validateTaskUpdatable(task);
        validateDueDate(dto.getDueDate());
        normalizeTaskType(dto);

        Employee employee = getActiveEmployee(dto.getAssignedEmployeeId());
        Employee oldEmployee = task.getAssignedEmployee();
        TransportOrder transportOrder = getOptionalTransportOrder(dto.getTransportOrderId());
        StockMovement stockMovement = getOptionalStockMovement(dto.getStockMovementId());

        validateTaskCompanyContext(employee, transportOrder, stockMovement);
        validateLinkedProcessContext(transportOrder, stockMovement);
        validateAssigneeRole(employee, transportOrder, stockMovement, dto.getTaskType());
        validateAssigneeOperationalScope(employee, stockMovement);
        validateEmployeeAvailabilityForTask(employee, dto.getDueDate());
        validateWarehouseManagerMutationScope(transportOrder, dto.getTaskType());

        if (!task.getAssignedEmployee().getId().equals(employee.getId())) {
            validateReassign(task, employee);
        }

        Long oldAssignedEmployeeId = task.getAssignedEmployee() != null ? task.getAssignedEmployee().getId() : null;
        LocalDateTime oldDueDate = task.getDueDate();
        TaskPriority oldPriority = task.getPriority();
        String oldTitle = task.getTitle();
        String oldDescription = task.getDescription();
        Long oldTransportOrderId = task.getTransportOrder() != null ? task.getTransportOrder().getId() : null;
        Long oldStockMovementId = task.getStockMovement() != null ? task.getStockMovement().getId() : null;

        TaskMapper.updateEntity(task, dto, employee, transportOrder, stockMovement);
        Task saved = _taskRepository.save(task);

        auditFacade.recordFieldChange(
                "TASK",
                saved.getId(),
                "assignedEmployee",
                oldAssignedEmployeeId,
                saved.getAssignedEmployee() != null ? saved.getAssignedEmployee().getId() : null
        );
        auditFacade.recordFieldChange("TASK", saved.getId(), "dueDate", oldDueDate, saved.getDueDate());
        auditFacade.recordFieldChange("TASK", saved.getId(), "priority", oldPriority, saved.getPriority());
        auditFacade.recordFieldChange("TASK", saved.getId(), "title", oldTitle, saved.getTitle());
        auditFacade.recordFieldChange("TASK", saved.getId(), "description", oldDescription, saved.getDescription());
        auditFacade.recordFieldChange(
                "TASK",
                saved.getId(),
                "transportOrder",
                oldTransportOrderId,
                saved.getTransportOrder() != null ? saved.getTransportOrder().getId() : null
        );
        auditFacade.recordFieldChange(
                "TASK",
                saved.getId(),
                "stockMovement",
                oldStockMovementId,
                saved.getStockMovement() != null ? saved.getStockMovement().getId() : null
        );

        if (oldEmployee == null || !oldEmployee.getId().equals(employee.getId())) {
            lifecycleNotificationService.notifyTaskAssigned(saved, oldEmployee, employee);
        }

        auditFacade.log(
                "UPDATE",
                "TASK",
                saved.getId(),
                "TASK is updated (ID: " + saved.getId() + ")"
        );

        return TaskMapper.toResponse(saved, timeService);
    }


    @Override
    @Transactional
    public int closeTransportTasks(Long transportOrderId, TaskStatus status) {
        if (transportOrderId == null) {
            throw new BadRequestException("Transport order id is required");
        }

        if (status != TaskStatus.COMPLETED && status != TaskStatus.CANCELLED) {
            throw new BadRequestException("Transport tasks can be auto-closed only as COMPLETED or CANCELLED");
        }

        List<Task> tasks = _taskRepository.findOpenTasksByTransportOrderId(
                transportOrderId,
                List.of(TaskStatus.NEW, TaskStatus.OPEN, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED)
        );

        int changedTasks = 0;
        for (Task task : tasks) {
            if (task.isFinalStatus() || task.getStatus() == status) {
                continue;
            }

            if (status == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.IN_PROGRESS) {
                moveTransportTaskBySystem(
                        task,
                        TaskStatus.IN_PROGRESS,
                        "Automatically started before completion because transport order " + transportOrderId + " was delivered",
                        "TASK_AUTO_STARTED"
                );
            }

            Task saved = moveTransportTaskBySystem(
                    task,
                    status,
                    "Automatically closed because transport order " + transportOrderId + " was closed",
                    "TASK_AUTO_CLOSED"
            );
            changedTasks++;

            if (saved.getAssignedEmployee() != null && saved.getAssignedEmployee().getUser() != null) {
                NotificationType type = status == TaskStatus.CANCELLED ? NotificationType.WARNING : NotificationType.INFO;
                notificationService.createSystemNotification(
                        saved.getAssignedEmployee().getUser().getId(),
                        "Transport task closed",
                        "Task '" + saved.getTitle() + "' was automatically changed to " + saved.getStatus() + " because transport order #" + transportOrderId + " was closed.",
                        type
                );
            }
        }

        return changedTasks;
    }


    @Override
    public AllowedStatusTransitionsResponse allowedStatusTransitions(Long id) {
        Task task = getTaskOrThrow(id);
        validateWarehouseManagerTaskAccess(task);
        return new AllowedStatusTransitionsResponse(
                task.getStatus().name(),
                lifecycleTransitionEngine.allowedStatuses(LifecycleEntityType.TASK, TaskStatus.class, task.getStatus()).stream().map(Enum::name).toList(),
                task.getVersion()
        );
    }

    private String transitionReasonSuffix(String reason) {
        if (reason == null || reason.isBlank()) {
            return "";
        }
        return " with reason: " + reason.trim();
    }

    private Task moveTransportTaskBySystem(Task task, TaskStatus targetStatus, String reason, String auditAction) {
        TaskStatus oldStatus = task.getStatus();
        LifecycleTransitionContext<TaskStatus> lifecycleContext = lifecycleTransitionEngine.validateSystem(
                LifecycleEntityType.TASK,
                task.getId(),
                TaskStatus.class,
                oldStatus,
                targetStatus,
                reason,
                task.getVersion()
        );

        applyTaskStatusTransitionTimestamps(task, targetStatus);
        Task saved = _taskRepository.save(task);

        auditFacade.recordStatusChange("TASK", saved.getId(), "status", oldStatus, saved.getStatus());
        auditFacade.log(
                auditAction,
                "TASK",
                saved.getId(),
                "TASK " + saved.getId() + " automatically changed from " + oldStatus + " to " + saved.getStatus() + transitionReasonSuffix(reason)
        );

        lifecycleTransitionEngine.afterTransition(lifecycleContext, TaskStatus.class);
        return saved;
    }


    private void normalizeTaskType(TaskCreate dto) {
        if (dto.getTaskType() == null) {
            dto.setTaskType(resolveTaskType(dto.getTransportOrderId(), dto.getStockMovementId()));
        }
    }

    private void normalizeTaskType(TaskUpdate dto) {
        if (dto.getTaskType() == null) {
            dto.setTaskType(resolveTaskType(dto.getTransportOrderId(), dto.getStockMovementId()));
        }
    }

    private TaskType resolveTaskType(Long transportOrderId, Long stockMovementId) {
        if (transportOrderId != null) {
            return TaskType.DRIVING;
        }
        if (stockMovementId != null) {
            return TaskType.STOCK_MOVEMENT;
        }
        return TaskType.ADMIN;
    }

    private void applyTaskStatusTransitionTimestamps(Task task, TaskStatus nextStatus) {
        LocalDateTime now = timeService.zoneIdForTask(task) != null ? timeService.nowSystem() : LocalDateTime.now();
        task.setStatus(nextStatus);
        if (nextStatus == TaskStatus.IN_PROGRESS && task.getStartedAt() == null) {
            task.setStartedAt(now);
        }
        if (nextStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(now);
        }
        if (nextStatus == TaskStatus.CANCELLED) {
            task.setCancelledAt(now);
            if (task.getCancelReason() == null || task.getCancelReason().isBlank()) {
                task.setCancelReason("Cancelled by lifecycle transition");
            }
        }
    }

    private void validateEmployeeAvailabilityForTask(Employee employee, LocalDateTime dueDate) {
        if (employee == null || dueDate == null) {
            return;
        }
        if (employee.getPosition() != EmployeePosition.DRIVER && employee.getPosition() != EmployeePosition.WORKER) {
            return;
        }
        boolean available = _shiftRepository.existsCoveringActiveOrPlannedShiftInterval(
                employee.getId(),
                dueDate,
                dueDate,
                List.of(rs.logistics.logistics_system.enums.ShiftStatus.PLANNED, rs.logistics.logistics_system.enums.ShiftStatus.ACTIVE)
        );
        if (!available) {
            throw new BadRequestException("Employee is not scheduled for the selected task due date");
        }
    }

    private void validateStatusTransition(TaskStatus current, TaskStatus next) {
        lifecycleTransitionEngine.requireTransitionAllowed(
                LifecycleEntityType.TASK,
                TaskStatus.class,
                current,
                next,
                "Task status cannot be changed from " + current + " to " + next
        );
    }

    private void validateAssigneeRole(Employee employee, TransportOrder transportOrder, StockMovement stockMovement, TaskType taskType) {
        if (employee == null || employee.getPosition() == null) {
            throw new BadRequestException("Assigned employee is invalid");
        }

        EmployeePosition position = employee.getPosition();
        TaskType effectiveType = taskType != null ? taskType : resolveTaskType(
                transportOrder != null ? transportOrder.getId() : null,
                stockMovement != null ? stockMovement.getId() : null
        );

        if (transportOrder != null) {
            boolean driverTask = effectiveType == TaskType.DRIVING;
            boolean warehouseTransportTask = effectiveType == TaskType.PICKING
                    || effectiveType == TaskType.PACKING
                    || effectiveType == TaskType.LOADING
                    || effectiveType == TaskType.UNLOADING;

            if (driverTask && position != EmployeePosition.DRIVER) {
                throw new BadRequestException("DRIVING transport tasks can only be assigned to DRIVER");
            }
            if (warehouseTransportTask && position != EmployeePosition.WORKER && position != EmployeePosition.WAREHOUSE_MANAGER) {
                throw new BadRequestException("Warehouse transport tasks can only be assigned to WORKER or WAREHOUSE_MANAGER");
            }
        }

        if (stockMovement != null
                && position != EmployeePosition.WAREHOUSE_MANAGER
                && position != EmployeePosition.WORKER) {
            throw new BadRequestException("Stock movement tasks can only be assigned to WAREHOUSE_MANAGER or WORKER");
        }

        if (transportOrder == null && stockMovement == null
                && effectiveType != TaskType.ADMIN
                && (position == EmployeePosition.COMPANY_ADMIN || position == EmployeePosition.HR_MANAGER)) {
            throw new BadRequestException("Administrative users can only receive ADMIN generic tasks");
        }

        if (transportOrder == null && stockMovement == null
                && (position == EmployeePosition.DRIVER || position == EmployeePosition.WORKER)) {
            throw new BadRequestException("Generic tasks cannot be assigned to DRIVER or WORKER without linked process");
        }
    }

    private void validateAssigneeOperationalScope(Employee employee, StockMovement stockMovement) {
        if (stockMovement == null || stockMovement.getWarehouse() == null || employee == null) {
            return;
        }

        if (employee.getPosition() == EmployeePosition.WORKER) {
            if (employee.getPrimaryWarehouse() == null) {
                throw new BadRequestException("WORKER must have primary warehouse before warehouse task assignment");
            }
            if (!domainScopeValidator.hasWarehouseAccess(employee, stockMovement.getWarehouse(), EmployeeWarehouseAccessType.WORKER, EmployeeWarehouseAccessType.PRIMARY)) {
                throw new ForbiddenException("WORKER can be assigned only to tasks in primary or assigned warehouse");
            }
        }

        if (employee.getPosition() == EmployeePosition.WAREHOUSE_MANAGER) {
            boolean managesWarehouse = warehouseRepository.findByManagerIdAndCompany_Id(
                            employee.getId(),
                            employee.getCompany() != null ? employee.getCompany().getId() : null
                    )
                    .stream()
                    .anyMatch(warehouse -> warehouse.getId().equals(stockMovement.getWarehouse().getId()))
                    || domainScopeValidator.hasWarehouseAccess(employee, stockMovement.getWarehouse(), EmployeeWarehouseAccessType.MANAGER, EmployeeWarehouseAccessType.PRIMARY);

            if (!managesWarehouse) {
                throw new ForbiddenException("WAREHOUSE_MANAGER can be assigned only to managed or assigned warehouses");
            }
        }
    }

    @Override
    public TaskResponse getById(Long id) {
        Task task = getTaskOrThrow(id);
        validateWarehouseManagerTaskAccess(task);
        validateDriverTaskAccess(task);
        return TaskMapper.toResponse(task, timeService);
    }

    @Override
    public PageResponse<TaskResponse> getAll(
            String search,
            TaskStatus status,
            TaskPriority priority,
            Long assignedEmployeeId,
            Long transportOrderId,
            Long stockMovementId,
            String linkedProcessType,
            Pageable pageable
    ) {
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Set<Long> managedWarehouseIds = resolveManagedWarehouseIdsForWarehouseManager();
        Page<Task> tasks = searchTasks(
                companyId,
                assignedEmployeeId,
                QueryParameterNormalizer.trimToNull(search),
                status,
                priority,
                transportOrderId,
                stockMovementId,
                authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER"),
                false,
                managedWarehouseIds,
                normalizeLinkedProcessType(linkedProcessType),
                pageable
        );

        var content = tasks.getContent().stream()
                .map(task -> TaskMapper.toResponse(task, timeService))
                .collect(Collectors.toList());

        return PageResponse.fromContent(content, tasks);
    }

    @Override
    public PageResponse<TaskResponse> getMyTasks(
            String search,
            TaskStatus status,
            TaskPriority priority,
            Long transportOrderId,
            Long stockMovementId,
            String linkedProcessType,
            Pageable pageable
    ) {
        if (authenticatedUserProvider.getAuthenticatedUser().getEmployee() == null) {
            throw new BadRequestException("Authenticated user is not linked to an employee");
        }

        Long employeeId = authenticatedUserProvider.getAuthenticatedUser().getEmployee().getId();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Set<Long> managedWarehouseIds = resolveManagedWarehouseIdsForWarehouseManager();
        Page<Task> tasks = searchTasks(
                companyId,
                employeeId,
                QueryParameterNormalizer.trimToNull(search),
                status,
                priority,
                transportOrderId,
                stockMovementId,
                authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER"),
                authenticatedUserProvider.hasRole("DRIVER"),
                managedWarehouseIds,
                normalizeLinkedProcessType(linkedProcessType),
                pageable
        );

        var content = tasks.getContent().stream()
                .map(task -> TaskMapper.toResponse(task, timeService))
                .collect(Collectors.toList());

        return PageResponse.fromContent(content, tasks);
    }


    @Override
    public List<StatusCountResponse> countByStatus(
            String search,
            TaskPriority priority,
            Long assignedEmployeeId,
            Long transportOrderId,
            Long stockMovementId,
            String linkedProcessType
    ) {
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Set<Long> managedWarehouseIds = resolveManagedWarehouseIdsForWarehouseManager();

        return _taskRepository.countGroupedByStatusFiltered(
                        companyId,
                        assignedEmployeeId,
                        QueryParameterNormalizer.trimToNull(search),
                        priority,
                        transportOrderId,
                        stockMovementId,
                        authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER"),
                        false,
                        authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER"),
                        managedWarehouseIds,
                        normalizeLinkedProcessType(linkedProcessType)
                )
                .stream()
                .map(row -> new StatusCountResponse(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Task task = getTaskOrThrow(id);
        validateWarehouseManagerTaskAccess(task);

        boolean canBeHardDeleted = _taskRepository.canBeHardDeleted(task.getId(), TaskStatus.NEW);

        if (!canBeHardDeleted) {
            if (task.getStatus() == TaskStatus.IN_PROGRESS) {
                throw new BadRequestException("Task already started and cannot be deleted. Complete or cancel it instead.");
            }

            if (task.getStatus() == TaskStatus.COMPLETED) {
                throw new BadRequestException("Completed task cannot be deleted because history must be preserved.");
            }

            if (task.getStatus() == TaskStatus.CANCELLED) {
                throw new BadRequestException("Cancelled task cannot be deleted because history must be preserved.");
            }

            if (task.getTransportOrder() != null) {
                throw new BadRequestException("Task linked to a transport order cannot be deleted. Cancel it instead.");
            }

            if (task.getStockMovement() != null) {
                throw new BadRequestException("Task linked to a stock movement cannot be deleted. Cancel it instead.");
            }

            throw new BadRequestException("Task cannot be deleted because it is already part of operational history. Cancel it instead.");
        }

        _taskRepository.delete(task);

        auditFacade.recordDelete("TASK", task.getId());
        auditFacade.log(
                "DELETE",
                "TASK",
                id,
                "TASK is deleted (ID: " + id + ")"
        );
    }

    @Override
    @Transactional
    public TaskResponse changeStatus(Long id, TaskStatus status, String reason, Long expectedVersion) {
        Task task = getTaskForUpdateOrThrow(id);
        validateWarehouseManagerTaskAccess(task);
        validateDriverTaskMutationAccess();

        TaskStatus current = task.getStatus();

        LifecycleTransitionContext<TaskStatus> lifecycleContext = lifecycleTransitionEngine.validate(
                LifecycleEntityType.TASK,
                task.getId(),
                TaskStatus.class,
                current,
                status,
                reason,
                expectedVersion,
                task.getVersion()
        );

        applyTaskStatusTransitionTimestamps(task, status);
        Task saved = _taskRepository.save(task);

        auditFacade.recordStatusChange("TASK", task.getId(), "status", current, saved.getStatus());
        auditFacade.log(
                "STATUS_CHANGE",
                "TASK",
                task.getId(),
                "TASK status changed from " + current + " to " + saved.getStatus() + transitionReasonSuffix(reason) + " (ID: " + task.getId() + ")"
        );

        NotificationType type = saved.getStatus() == TaskStatus.CANCELLED
                ? NotificationType.WARNING
                : NotificationType.INFO;

        lifecycleTransitionEngine.afterTransition(lifecycleContext, TaskStatus.class);

        lifecycleNotificationService.notifyTaskStatusChanged(saved, current, saved.getStatus(), reason);

        synchronizeTransportFromTaskTransition(saved, current, saved.getStatus(), reason);

        return TaskMapper.toResponse(saved, timeService);
    }

    @Override
    @Transactional
    public TaskResponse assignTask(Long id, Long employeeId) {
        Task task = getTaskOrThrow(id);
        validateWarehouseManagerTaskAccess(task);

        Employee oldEmployee = task.getAssignedEmployee();
        Employee employee = getActiveEmployee(employeeId);
        validateAssigneeRole(employee, task.getTransportOrder(), task.getStockMovement(), task.getTaskType());
        validateAssigneeOperationalScope(employee, task.getStockMovement());
        validateEmployeeAvailabilityForTask(employee, task.getDueDate());
        validateReassign(task, employee);

        if (!authenticatedUserProvider.isOverlord()) {
            authenticatedUserProvider.ensureSameCompany(
                    oldEmployee != null && oldEmployee.getCompany() != null ? oldEmployee.getCompany().getId() : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(),
                    employee.getCompany() != null ? employee.getCompany().getId() : null,
                    "Task can be assigned only within the same company"
            );
        }

        Long oldEmployeeId = oldEmployee != null ? oldEmployee.getId() : null;
        TaskStatus oldStatus = task.getStatus();
        task.setAssignedEmployee(employee);
        if (oldStatus == TaskStatus.OPEN || oldStatus == TaskStatus.NEW) {
            validateStatusTransition(oldStatus, TaskStatus.ASSIGNED);
            applyTaskStatusTransitionTimestamps(task, TaskStatus.ASSIGNED);
        }

        Task saved = _taskRepository.save(task);
        if (oldStatus != saved.getStatus()) {
            auditFacade.recordStatusChange("TASK", saved.getId(), "status", oldStatus, saved.getStatus());
            auditFacade.log("STATUS_CHANGE", "TASK", saved.getId(), "TASK status changed from " + oldStatus + " to " + saved.getStatus() + " because the task was assigned (ID: " + saved.getId() + ")");
        }

        lifecycleNotificationService.notifyTaskAssigned(saved, oldEmployee, employee);

        auditFacade.recordFieldChange("TASK", saved.getId(), "assignedEmployee", oldEmployeeId, employeeId);
        auditFacade.log(
                "ASSIGN",
                "TASK",
                saved.getId(),
                "TASK is reassigned (ID: " + saved.getId() + ") to employee " + employee.getId()
        );

        return TaskMapper.toResponse(saved, timeService);
    }

    private void synchronizeTransportFromTaskTransition(Task task, TaskStatus oldStatus, TaskStatus newStatus, String reason) {
        if (task == null || task.getTransportOrder() == null || oldStatus == newStatus) {
            return;
        }

        TransportOrder transportOrder = authenticatedUserProvider.isOverlord()
                ? _transportOrderRepository.findByIdForUpdate(task.getTransportOrder().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"))
                : _transportOrderRepository.findByIdAndCreatedByCompanyIdForUpdate(
                        task.getTransportOrder().getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                ).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        if (newStatus == TaskStatus.IN_PROGRESS) {
            auditFacade.log(
                    "WORKFLOW_TASK_STARTED",
                    "TRANSPORT_ORDER",
                    transportOrder.getId(),
                    "Task " + task.getId() + " started inside transport workflow " + transportOrder.getId()
            );
            return;
        }

        if (newStatus == TaskStatus.BLOCKED) {
            auditFacade.log(
                    "WORKFLOW_TASK_BLOCKED",
                    "TRANSPORT_ORDER",
                    transportOrder.getId(),
                    "Task " + task.getId() + " blocked transport workflow " + transportOrder.getId() + transitionReasonSuffix(reason)
            );
            notifyTransportStakeholders(transportOrder, "Transport workflow blocked", "Task '" + task.getTitle() + "' blocked transport order #" + transportOrder.getId() + ".", NotificationType.WARNING);
            return;
        }

        if (newStatus != TaskStatus.COMPLETED) {
            return;
        }

        TransportOrderStatus nextStatus = nextTransportStatusForCompletedTask(task.getTaskType(), transportOrder.getStatus());
        if (nextStatus == null) {
            return;
        }

        TransportOrderStatus oldTransportStatus = transportOrder.getStatus();
        LifecycleTransitionContext<TransportOrderStatus> lifecycleContext = lifecycleTransitionEngine.validateSystem(
                LifecycleEntityType.TRANSPORT_ORDER,
                transportOrder.getId(),
                TransportOrderStatus.class,
                oldTransportStatus,
                nextStatus,
                "Automatically advanced after task " + task.getId() + " completion",
                transportOrder.getVersion()
        );

        transportOrder.setStatus(nextStatus);
        TransportOrder savedTransport = _transportOrderRepository.save(transportOrder);
        auditFacade.recordStatusChange("TRANSPORT_ORDER", savedTransport.getId(), "status", oldTransportStatus, savedTransport.getStatus());
        auditFacade.log(
                "WORKFLOW_STATUS_CHANGE",
                "TRANSPORT_ORDER",
                savedTransport.getId(),
                "Transport order automatically changed from " + oldTransportStatus + " to " + savedTransport.getStatus() + " after task " + task.getId() + " was completed"
        );
        lifecycleTransitionEngine.afterTransition(lifecycleContext, TransportOrderStatus.class);

        createFollowUpTaskForTransportStatus(savedTransport, nextStatus);
    }

    private TransportOrderStatus nextTransportStatusForCompletedTask(TaskType taskType, TransportOrderStatus currentStatus) {
        if (taskType == TaskType.PICKING && currentStatus == TransportOrderStatus.PICKING) {
            return TransportOrderStatus.PACKING;
        }
        if (taskType == TaskType.PACKING && currentStatus == TransportOrderStatus.PACKING) {
            return TransportOrderStatus.READY_FOR_LOADING;
        }
        if (taskType == TaskType.LOADING && currentStatus == TransportOrderStatus.READY_FOR_LOADING) {
            return TransportOrderStatus.LOADING;
        }
        return null;
    }

    private void createFollowUpTaskForTransportStatus(TransportOrder transportOrder, TransportOrderStatus status) {
        TaskType nextTaskType = switch (status) {
            case PACKING -> TaskType.PACKING;
            case READY_FOR_LOADING -> TaskType.LOADING;
            default -> null;
        };

        if (nextTaskType == null || transportOrder.getSourceWarehouse() == null || transportOrder.getSourceWarehouse().getManager() == null) {
            return;
        }

        boolean alreadyExists = !_taskRepository.findTransportTasksByTypeAndStatusIn(
                transportOrder.getId(),
                nextTaskType,
                List.of(TaskStatus.NEW, TaskStatus.OPEN, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED)
        ).isEmpty();
        if (alreadyExists) {
            return;
        }

        Task followUp = new Task(
                nextTaskType + " for " + transportOrder.getOrderNumber(),
                "Automatically generated " + nextTaskType + " task after transport workflow moved to " + status + ".",
                LocalDateTime.now().plusHours(1),
                TaskPriority.valueOf(transportOrder.getPriority().name()),
                nextTaskType,
                transportOrder.getSourceWarehouse().getManager(),
                transportOrder,
                null
        );
        followUp.setStatus(TaskStatus.OPEN);
        Task saved = _taskRepository.save(followUp);
        auditFacade.recordCreate("TASK", saved.getId());
        auditFacade.log("WORKFLOW_TASK_CREATED", "TASK", saved.getId(), "Task automatically created for transport order " + transportOrder.getId() + " after workflow transition to " + status);

        if (saved.getAssignedEmployee() != null && saved.getAssignedEmployee().getUser() != null) {
            notificationService.createSystemNotification(
                    saved.getAssignedEmployee().getUser().getId(),
                    "Transport task created",
                    "Task '" + saved.getTitle() + "' was created for transport order #" + transportOrder.getId() + ".",
                    NotificationType.INFO
            );
        }
    }

    private void notifyTransportStakeholders(TransportOrder transportOrder, String title, String message, NotificationType type) {
        if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
            notificationService.createSystemNotification(transportOrder.getAssignedEmployee().getUser().getId(), title, message, type);
        }
        if (transportOrder.getSourceWarehouse() != null
                && transportOrder.getSourceWarehouse().getManager() != null
                && transportOrder.getSourceWarehouse().getManager().getUser() != null) {
            notificationService.createSystemNotification(transportOrder.getSourceWarehouse().getManager().getUser().getId(), title, message, type);
        }
        if (transportOrder.getDestinationWarehouse() != null
                && transportOrder.getDestinationWarehouse().getManager() != null
                && transportOrder.getDestinationWarehouse().getManager().getUser() != null) {
            notificationService.createSystemNotification(transportOrder.getDestinationWarehouse().getManager().getUser().getId(), title, message, type);
        }
    }

    private Page<Task> searchTasks(
            Long companyId,
            Long assignedEmployeeId,
            String search,
            TaskStatus status,
            TaskPriority priority,
            Long transportOrderId,
            Long stockMovementId,
            boolean excludeTransportOrders,
            boolean requireTransportOrder,
            Set<Long> managedWarehouseIds,
            String linkedProcessType,
            Pageable pageable
    ) {
        boolean restrictManagedWarehouses = authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER");

        if (restrictManagedWarehouses && managedWarehouseIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        return _taskRepository.searchTasks(
                companyId,
                assignedEmployeeId,
                search,
                status,
                priority,
                transportOrderId,
                stockMovementId,
                excludeTransportOrders,
                requireTransportOrder,
                restrictManagedWarehouses,
                restrictManagedWarehouses ? managedWarehouseIds : Set.of(-1L),
                linkedProcessType,
                pageable
        );
    }

    private Set<Long> resolveManagedWarehouseIdsForWarehouseManager() {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return Set.of();
        }

        User user = authenticatedUserProvider.getAuthenticatedUser();
        if (user.getEmployee() == null) {
            throw new BadRequestException("Authenticated warehouse manager is not linked to an employee");
        }

        Long employeeId = user.getEmployee().getId();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        LocalDate today = LocalDate.now();

        Set<Long> managedWarehouseIds = warehouseRepository.findByManagerIdAndCompany_Id(employeeId, companyId)
                .stream()
                .map(warehouse -> warehouse.getId())
                .collect(Collectors.toSet());

        employeeWarehouseAssignmentRepository.findByEmployee_IdAndCompany_IdOrderByWarehouse_NameAsc(employeeId, companyId)
                .stream()
                .filter(assignment -> Boolean.TRUE.equals(assignment.getActive()))
                .filter(assignment -> assignment.getWarehouse() != null && assignment.getWarehouse().getId() != null)
                .filter(assignment -> assignment.getAccessType() == EmployeeWarehouseAccessType.MANAGER
                        || assignment.getAccessType() == EmployeeWarehouseAccessType.PRIMARY)
                .filter(assignment -> assignment.getValidFrom() == null || !assignment.getValidFrom().isAfter(today))
                .filter(assignment -> assignment.getValidTo() == null || !assignment.getValidTo().isBefore(today))
                .map(assignment -> assignment.getWarehouse().getId())
                .forEach(managedWarehouseIds::add);

        return managedWarehouseIds;
    }

    private String normalizeLinkedProcessType(String linkedProcessType) {
        if (linkedProcessType == null || linkedProcessType.trim().isEmpty() || "ALL".equalsIgnoreCase(linkedProcessType.trim())) {
            return null;
        }

        String normalized = linkedProcessType.trim().toUpperCase();

        if (!normalized.equals("UNLINKED")
                && !normalized.equals("TRANSPORT_ORDER")
                && !normalized.equals("STOCK_MOVEMENT")) {
            throw new BadRequestException("Invalid linked process type");
        }

        return normalized;
    }

    private boolean canWarehouseManagerAccessTask(Task task) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return true;
        }

        Set<Long> managedWarehouseIds = resolveManagedWarehouseIdsForWarehouseManager();

        if (task.getStockMovement() != null && task.getStockMovement().getWarehouse() != null) {
            return managedWarehouseIds.contains(task.getStockMovement().getWarehouse().getId());
        }

        if (task.getTransportOrder() != null) {
            return isWarehouseSideTransportTask(task)
                    && (
                    task.getTransportOrder().getSourceWarehouse() != null && managedWarehouseIds.contains(task.getTransportOrder().getSourceWarehouse().getId())
                            || task.getTransportOrder().getDestinationWarehouse() != null && managedWarehouseIds.contains(task.getTransportOrder().getDestinationWarehouse().getId())
            );
        }

        return false;
    }

    private void validateWarehouseManagerTaskAccess(Task task) {
        if (!canWarehouseManagerAccessTask(task)) {
            throw new ForbiddenException("WAREHOUSE_MANAGER can access only warehouse tasks");
        }
    }

    private void validateDriverTaskAccess(Task task) {
        if (!authenticatedUserProvider.hasRole("DRIVER")) {
            return;
        }

        if (task.getTransportOrder() == null) {
            throw new ForbiddenException("DRIVER can access only transport-linked tasks");
        }
    }

    private void validateDriverTaskMutationAccess() {
        if (authenticatedUserProvider.hasRole("DRIVER")) {
            throw new ForbiddenException("DRIVER cannot change task status");
        }
    }

    private void validateWarehouseManagerMutationScope(TransportOrder transportOrder, TaskType taskType) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER") || transportOrder == null) {
            return;
        }

        if (!(taskType == TaskType.PICKING || taskType == TaskType.PACKING || taskType == TaskType.LOADING || taskType == TaskType.UNLOADING)) {
            throw new ForbiddenException("WAREHOUSE_MANAGER can create or modify only warehouse-side transport tasks");
        }

        Set<Long> managedWarehouseIds = resolveManagedWarehouseIdsForWarehouseManager();
        boolean touchesManagedWarehouse = (transportOrder.getSourceWarehouse() != null && managedWarehouseIds.contains(transportOrder.getSourceWarehouse().getId()))
                || (transportOrder.getDestinationWarehouse() != null && managedWarehouseIds.contains(transportOrder.getDestinationWarehouse().getId()));

        if (!touchesManagedWarehouse) {
            throw new ForbiddenException("WAREHOUSE_MANAGER can create or modify only warehouse-side transport tasks for managed warehouses");
        }
    }

    private boolean isWarehouseSideTransportTask(Task task) {
        return task != null && (task.getTaskType() == TaskType.PICKING
                || task.getTaskType() == TaskType.PACKING
                || task.getTaskType() == TaskType.LOADING
                || task.getTaskType() == TaskType.UNLOADING);
    }

    private Employee getActiveEmployee(Long employeeId) {
        Employee employee = authenticatedUserProvider.isOverlord()
                ? _employeeRepository.findById(employeeId)
                  .orElseThrow(() -> new ResourceNotFoundException("Employee not found"))
                : _employeeRepository.findByIdAndCompany_Id(
                employeeId,
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getActive() == null || !employee.getActive()) {
            throw new BadRequestException("Task cannot be assigned to an inactive employee");
        }

        return employee;
    }

    private TransportOrder getOptionalTransportOrder(Long transportOrderId) {
        if (transportOrderId == null) {
            return null;
        }

        TransportOrder transportOrder = authenticatedUserProvider.isOverlord()
                ? _transportOrderRepository.findById(transportOrderId)
                  .orElseThrow(() -> new ResourceNotFoundException("TransportOrder not found"))
                : _transportOrderRepository.findByIdAndCreatedBy_Company_Id(
                transportOrderId,
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ).orElseThrow(() -> new ResourceNotFoundException("TransportOrder not found"));

        if (transportOrder.getStatus() == TransportOrderStatus.DELIVERED
                || transportOrder.getStatus() == TransportOrderStatus.FAILED
                || transportOrder.getStatus() == TransportOrderStatus.CANCELLED) {
            throw new BadRequestException("Task cannot be linked to a terminal transport order");
        }

        return transportOrder;
    }

    private void validateDueDate(LocalDateTime dueDate) {
        if (dueDate == null || dueDate.isBefore(resolveNowForTaskContext())) {
            throw new BadRequestException("Due date is invalid");
        }
    }


    private LocalDateTime resolveNowForTaskContext() {
        if (authenticatedUserProvider.isOverlord()) {
            return timeService.nowSystem();
        }

        User user = authenticatedUserProvider.getAuthenticatedUser();
        if (user != null && user.getEmployee() != null) {
            return timeService.nowForEmployee(user.getEmployee());
        }

        return timeService.nowSystem();
    }
    private void validateTaskUpdatable(Task task) {
        if (task.getStatus() != TaskStatus.NEW) {
            throw new BadRequestException("Only NEW task can be updated");
        }
    }

    private void validateReassign(Task task, Employee newEmployee) {
        if (task.getStatus() == TaskStatus.COMPLETED || task.getStatus() == TaskStatus.CANCELLED) {
            throw new BadRequestException("Final task cannot be reassigned");
        }

        if (task.getAssignedEmployee() != null && task.getAssignedEmployee().getId().equals(newEmployee.getId())) {
            throw new BadRequestException("Task is already assigned to this employee");
        }

        if (task.getStatus() == TaskStatus.IN_PROGRESS) {
            throw new BadRequestException("Task in progress cannot be reassigned");
        }
    }

    private Task getTaskForUpdateOrThrow(Long id) {
        Task task = authenticatedUserProvider.isOverlord()
                ? _taskRepository.findByIdForUpdate(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"))
                : _taskRepository.findByIdAndAssignedEmployeeCompanyIdForUpdate(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (authenticatedUserProvider.hasRole("DRIVER") || authenticatedUserProvider.hasRole("WORKER")) {
            Long authenticatedUserId = authenticatedUserProvider.getAuthenticatedUserId();
            Long assignedUserId = task.getAssignedEmployee() != null && task.getAssignedEmployee().getUser() != null
                    ? task.getAssignedEmployee().getUser().getId()
                    : null;
            if (assignedUserId == null || !authenticatedUserId.equals(assignedUserId)) {
                throw new ResourceNotFoundException("Task not found");
            }
        }

        return task;
    }

    private Task getTaskOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _taskRepository.findByIdWithDetails(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        }

        return _taskRepository.findByIdAndAssignedEmployee_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private void validateTaskCompanyContext(Employee employee, TransportOrder transportOrder, StockMovement stockMovement) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        Long employeeCompanyId = employee != null && employee.getCompany() != null ? employee.getCompany().getId() : null;
        authenticatedUserProvider.ensureCompanyAccess(employeeCompanyId);

        if (transportOrder != null) {
            Long transportCompanyId = transportOrder.getCreatedBy() != null && transportOrder.getCreatedBy().getCompany() != null
                    ? transportOrder.getCreatedBy().getCompany().getId()
                    : null;

            authenticatedUserProvider.ensureSameCompany(
                    employeeCompanyId,
                    transportCompanyId,
                    "Task employee and transport order must belong to the same company"
            );
        }

        if (stockMovement != null) {
            Long stockMovementCompanyId = stockMovement.getWarehouse() != null && stockMovement.getWarehouse().getCompany() != null
                    ? stockMovement.getWarehouse().getCompany().getId()
                    : null;

            authenticatedUserProvider.ensureSameCompany(
                    employeeCompanyId,
                    stockMovementCompanyId,
                    "Task employee and stock movement must belong to the same company"
            );
        }
    }

    private StockMovement getOptionalStockMovement(Long stockMovementId) {
        if (stockMovementId == null) {
            return null;
        }

        return authenticatedUserProvider.isOverlord()
                ? stockMovementRepository.findById(stockMovementId)
                    .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"))
                : stockMovementRepository.findByIdAndWarehouse_Company_Id(
                    stockMovementId,
                    authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                ).orElseThrow(() -> new ResourceNotFoundException("StockMovement not found"));
    }

    private void validateLinkedProcessContext(TransportOrder transportOrder, StockMovement stockMovement) {
        if (transportOrder != null && stockMovement != null) {
            Long taskTransportOrderId = transportOrder.getId();
            Long stockMovementTransportOrderId = stockMovement.getTransportOrder() != null
                    ? stockMovement.getTransportOrder().getId()
                    : null;

            if (stockMovementTransportOrderId != null && !stockMovementTransportOrderId.equals(taskTransportOrderId)) {
                throw new BadRequestException("Task transport order and stock movement must belong to the same process");
            }
        }
    }
}
