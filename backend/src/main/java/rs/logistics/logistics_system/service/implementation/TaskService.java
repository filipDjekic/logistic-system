package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService implements TaskServiceDefinition {

    private final TaskRepository _taskRepository;
    private final EmployeeRepository _employeeRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final StockMovementRepository stockMovementRepository;

    private final NotificationServiceDefinition notificationService;
    private final AuditFacadeDefinition auditFacade;

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional
    public TaskResponse create(TaskCreate dto) {
        validateDueDate(dto.getDueDate());

        Employee employee = getActiveEmployee(dto.getAssignedEmployeeId());
        TransportOrder transportOrder = getOptionalTransportOrder(dto.getTransportOrderId());
        StockMovement stockMovement = getOptionalStockMovement(dto.getStockMovementId());

        validateTaskCompanyContext(employee, transportOrder, stockMovement);
        validateLinkedProcessContext(transportOrder, stockMovement);
        validateAssigneeRole(employee, transportOrder, stockMovement);
        validateWarehouseManagerMutationScope(transportOrder);

        Task task = TaskMapper.toEntity(dto, employee, transportOrder, stockMovement);
        task.setStatus(TaskStatus.NEW);
        Task saved = _taskRepository.save(task);

        if (employee.getUser() != null) {
            notificationService.createSystemNotification(
                    employee.getUser().getId(),
                    "Task assigned",
                    "Task '" + saved.getTitle() + "' has been assigned to you.",
                    NotificationType.INFO
            );
        }

        auditFacade.recordCreate("TASK", saved.getId());
        auditFacade.log(
                "CREATE",
                "TASK",
                saved.getId(),
                "TASK is created (ID: " + saved.getId() + ")"
        );

        return TaskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public TaskResponse update(Long id, TaskUpdate dto) {
        Task task = getTaskOrThrow(id);

        validateTaskUpdatable(task);
        validateDueDate(dto.getDueDate());

        Employee employee = getActiveEmployee(dto.getAssignedEmployeeId());
        Employee oldEmployee = task.getAssignedEmployee();
        TransportOrder transportOrder = getOptionalTransportOrder(dto.getTransportOrderId());
        StockMovement stockMovement = getOptionalStockMovement(dto.getStockMovementId());

        validateTaskCompanyContext(employee, transportOrder, stockMovement);
        validateLinkedProcessContext(transportOrder, stockMovement);
        validateAssigneeRole(employee, transportOrder, stockMovement);
        validateWarehouseManagerMutationScope(transportOrder);

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

        if (oldEmployee != null && !oldEmployee.getId().equals(employee.getId()) && oldEmployee.getUser() != null) {
            notificationService.createSystemNotification(
                    oldEmployee.getUser().getId(),
                    "Task reassigned",
                    "Task '" + saved.getTitle() + "' is no longer assigned to you.",
                    NotificationType.WARNING
            );
        }

        if (employee.getUser() != null && (oldEmployee == null || !oldEmployee.getId().equals(employee.getId()))) {
            notificationService.createSystemNotification(
                    employee.getUser().getId(),
                    "Task assigned",
                    "Task '" + saved.getTitle() + "' has been assigned to you.",
                    NotificationType.INFO
            );
        }

        auditFacade.log(
                "UPDATE",
                "TASK",
                saved.getId(),
                "TASK is updated (ID: " + saved.getId() + ")"
        );

        return TaskMapper.toResponse(saved);
    }


    private void validateAssigneeRole(Employee employee, TransportOrder transportOrder, StockMovement stockMovement) {
        if (employee == null || employee.getPosition() == null) {
            throw new BadRequestException("Assigned employee is invalid");
        }

        EmployeePosition position = employee.getPosition();

        if (transportOrder != null && position != EmployeePosition.DRIVER) {
            throw new BadRequestException("Transport tasks can only be assigned to DRIVER");
        }

        if (stockMovement != null
                && position != EmployeePosition.WAREHOUSE_MANAGER
                && position != EmployeePosition.WORKER) {
            throw new BadRequestException("Stock movement tasks can only be assigned to WAREHOUSE_MANAGER or WORKER");
        }

        if (transportOrder == null && stockMovement == null
                && (position == EmployeePosition.DRIVER || position == EmployeePosition.WORKER)) {
            throw new BadRequestException("Generic tasks cannot be assigned to DRIVER or WORKER without linked process");
        }
    }

    @Override
    public TaskResponse getById(Long id) {
        Task task = getTaskOrThrow(id);
        validateWarehouseManagerTaskAccess(task);
        validateDriverTaskAccess(task);
        return TaskMapper.toResponse(task);
    }

    @Override
    public List<TaskResponse> getAll() {
        List<Task> tasks = authenticatedUserProvider.isOverlord()
                ? _taskRepository.findAll()
                : _taskRepository.findAllByAssignedEmployee_Company_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return tasks.stream()
                .filter(this::canWarehouseManagerAccessTask)
                .map(TaskMapper::toResponse)
                .collect(Collectors.toList());
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
    public TaskResponse changeStatus(Long id, TaskStatus status) {
        Task task = getTaskOrThrow(id);
        validateWarehouseManagerTaskAccess(task);
        validateDriverTaskMutationAccess();

        TaskStatus current = task.getStatus();

        if (status == null) {
            throw new BadRequestException("Task status is required");
        }

        if (current == status) {
            throw new BadRequestException("Task already has selected status");
        }

        switch (current) {
            case NEW:
                if (status != TaskStatus.IN_PROGRESS && status != TaskStatus.CANCELLED) {
                    throw new BadRequestException("Task status cannot be changed");
                }
                break;
            case IN_PROGRESS:
                if (status != TaskStatus.COMPLETED && status != TaskStatus.CANCELLED) {
                    throw new BadRequestException("Task status cannot be changed");
                }
                break;
            case CANCELLED:
                throw new BadRequestException("Task is already cancelled");
            case COMPLETED:
                throw new BadRequestException("Task is already completed");
            default:
                throw new BadRequestException("Unsupported task status");
        }

        task.setStatus(status);
        Task saved = _taskRepository.save(task);

        auditFacade.recordStatusChange("TASK", task.getId(), "status", current, saved.getStatus());
        auditFacade.log(
                "STATUS_CHANGE",
                "TASK",
                task.getId(),
                "TASK status changed from " + current + " to " + saved.getStatus() + " (ID: " + task.getId() + ")"
        );

        NotificationType type = saved.getStatus() == TaskStatus.CANCELLED
                ? NotificationType.WARNING
                : NotificationType.INFO;

        if (saved.getAssignedEmployee() != null && saved.getAssignedEmployee().getUser() != null) {
            notificationService.createSystemNotification(
                    saved.getAssignedEmployee().getUser().getId(),
                    "Task status updated",
                    "Task '" + saved.getTitle() + "' status changed to " + saved.getStatus() + ".",
                    type
            );
        }

        return TaskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public TaskResponse assignTask(Long id, Long employeeId) {
        Task task = getTaskOrThrow(id);
        validateWarehouseManagerTaskAccess(task);

        Employee oldEmployee = task.getAssignedEmployee();
        Employee employee = getActiveEmployee(employeeId);
        validateReassign(task, employee);

        if (!authenticatedUserProvider.isOverlord()) {
            authenticatedUserProvider.ensureSameCompany(
                    oldEmployee != null && oldEmployee.getCompany() != null ? oldEmployee.getCompany().getId() : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(),
                    employee.getCompany() != null ? employee.getCompany().getId() : null,
                    "Task can be assigned only within the same company"
            );
        }

        Long oldEmployeeId = oldEmployee != null ? oldEmployee.getId() : null;
        task.setAssignedEmployee(employee);

        Task saved = _taskRepository.save(task);

        if (oldEmployee != null
                && !oldEmployee.getId().equals(employee.getId())
                && oldEmployee.getUser() != null) {
            notificationService.createSystemNotification(
                    oldEmployee.getUser().getId(),
                    "Task reassigned",
                    "Task '" + task.getTitle() + "' is no longer assigned to you.",
                    NotificationType.WARNING
            );
        }

        if (employee.getUser() != null) {
            notificationService.createSystemNotification(
                    employee.getUser().getId(),
                    "Task assigned",
                    "Task '" + task.getTitle() + "' has been assigned to you.",
                    NotificationType.INFO
            );
        }

        auditFacade.recordFieldChange("TASK", saved.getId(), "assignedEmployee", oldEmployeeId, employeeId);
        auditFacade.log(
                "ASSIGN",
                "TASK",
                saved.getId(),
                "TASK is reassigned (ID: " + saved.getId() + ") to employee " + employee.getId()
        );

        return TaskMapper.toResponse(saved);
    }


    private boolean canWarehouseManagerAccessTask(Task task) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return true;
        }

        return task.getTransportOrder() == null;
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

    private void validateWarehouseManagerMutationScope(TransportOrder transportOrder) {
        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER") && transportOrder != null) {
            throw new ForbiddenException("WAREHOUSE_MANAGER cannot create or modify transport tasks");
        }
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
                || transportOrder.getStatus() == TransportOrderStatus.CANCELLED) {
            throw new BadRequestException("Task cannot be linked to a completed or cancelled transport order");
        }

        return transportOrder;
    }

    private void validateDueDate(LocalDateTime dueDate) {
        if (dueDate == null || dueDate.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Due date is invalid");
        }
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

    private Task getTaskOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _taskRepository.findById(id)
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
