package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.enums.ChangeType;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;
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

    private final ActivityLogServiceDefinition activityLogService;
    private final ChangeHistoryServiceDefinition changeHistoryService;

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public TaskResponse create(TaskCreate dto) {

        validateDueDate(dto.getDueDate());

        Employee employee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("TransportOrder not found"));

        Task task = TaskMapper.toEntity(dto, employee, transportOrder);
        task.setStatus(TaskStatus.NEW);
        Task saved =  _taskRepository.save(task);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "TASK",
                saved.getId(),
                "TASK is created (ID: " + saved.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TASK",
                saved.getId(),
                ChangeType.CREATE,
                "ENTITY",
                " ",
                "INITIAL_STATE",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return TaskMapper.toResponse(saved);
    }

    @Override
    public TaskResponse update(Long id, TaskUpdate dto) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        validateTaskUpdatable(task);
        validateDueDate(dto.getDueDate());

        Employee employee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("TransportOrder not found"));

        if(!task.getAssignedEmployee().getId().equals(employee.getId())) {
            validateReassign(task, employee);
        }

        // change history part

        if(!task.getAssignedEmployee().getId().equals(employee.getId())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TASK",
                    task.getId(),
                    ChangeType.UPDATE,
                    "assignedEmployee",
                    task.getAssignedEmployee().getId().toString(),
                    dto.getAssignedEmployeeId().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if(!task.getDueDate().equals(dto.getDueDate())){
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TASK",
                    task.getId(),
                    ChangeType.UPDATE,
                    "dueDate",
                    task.getDueDate().toString(),
                    dto.getDueDate().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if(!task.getPriority().equals(dto.getPriority())){
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TASK",
                    task.getId(),
                    ChangeType.UPDATE,
                    "priority",
                    task.getPriority().toString(),
                    dto.getPriority().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        // end

        TaskMapper.updateEntity(task, dto, employee, transportOrder);
        Task saved = _taskRepository.save(task);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "TASK",
                saved.getId(),
                "TASK is updated (ID: " + saved.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return TaskMapper.toResponse(saved);
    }

    @Override
    public TaskResponse getById(Long id) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        return TaskMapper.toResponse(task);
    }

    @Override
    public List<TaskResponse> getAll() {
        return _taskRepository.findAll().stream().map(TaskMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        _taskRepository.delete(task);

        changeHistoryService.create(new ChangeHistoryCreate(
                "TASK",
                task.getId(),
                ChangeType.DELETE,
                "ENTITY",
                "INITIAL_STATE",
                "DELETED",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "TASK",
                id,
                "TASK is deleted (ID: " + id + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    @Override
    public TaskResponse changeStatus(Long id, TaskStatus status) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        TaskStatus current = task.getStatus();

        switch (current) {
            case NEW:
                if(status.equals(TaskStatus.IN_PROGRESS) ||  status.equals(TaskStatus.CANCELLED)) {
                    task.setStatus(status);
                }
                else{
                    throw new BadRequestException("Task status cannot be changed");
                }
                break;
            case IN_PROGRESS:
                if(status.equals(TaskStatus.COMPLETED) ||  status.equals(TaskStatus.CANCELLED)) {
                    task.setStatus(status);
                }
                else {
                    throw new BadRequestException("Task status cannot be changed");
                }
                break;
            case CANCELLED:
                throw new BadRequestException("Task is already cancelled");
            case COMPLETED:
                throw new BadRequestException("Task is already completed");
        }

        changeHistoryService.create(new ChangeHistoryCreate(
                "TASK",
                task.getId(),
                ChangeType.UPDATE,
                "status",
                current.toString(),
                task.getStatus().toString(),
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "STATUS_CHANGE",
                "TASK",
                task.getId(),
                "TASK status changed (ID: " + task.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        Task saved = _taskRepository.save(task);

        return TaskMapper.toResponse(saved);
    }

    @Override
    public TaskResponse assignTask(Long id, Long employeeId) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee employee = getActiveEmployee(employeeId);

        validateReassign(task, employee);

        Long oldEmployeeId = task.getAssignedEmployee().getId();
        task.setAssignedEmployee(employee);

        Task saved = _taskRepository.save(task);

        changeHistoryService.create(new ChangeHistoryCreate(
                "TASK",
                saved.getId(),
                ChangeType.UPDATE,
                "assignedEmployee",
                oldEmployeeId.toString(),
                employeeId.toString(),
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "ASSIGN",
                "TASK",
                saved.getId(),
                "TASK is reassigned (ID: " + saved.getId() + ") to employee " + employee.getId(),
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return TaskMapper.toResponse(saved);
    }

    // helpers

    private Employee getActiveEmployee(Long employeeId) {
        Employee employee = _employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getActive() == null || !employee.getActive()) {
            throw new BadRequestException("Task cannot be assigned to an inactive employee");
        }

        return employee;
    }

    private TransportOrder getTransportOrder(Long transportOrderId) {
        return _transportOrderRepository.findById(transportOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("TransportOrder not found"));
    }

    private void validateDueDate(LocalDateTime dueDate) {
        if (dueDate == null || dueDate.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Due date is invalid");
        }
    }

    private void validateTaskUpdatable(Task task) {
        if (task.getStatus() == TaskStatus.COMPLETED || task.getStatus() == TaskStatus.CANCELLED) {
            throw new BadRequestException("Final task cannot be updated");
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
}
