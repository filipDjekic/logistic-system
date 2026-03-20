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
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
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

    @Override
    public TaskResponse create(TaskCreate dto) {

        if(dto.getDueDate().isBefore(LocalDateTime.now())){
            throw new BadRequestException("Due Date is invalid");
        }

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
                saved.getId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TASK",
                saved.getId(),
                ChangeType.CREATE,
                "ENTITY",
                " ",
                "INITIAL_STATE",
                saved.getAssignedEmployee().getId()
        ));

        return TaskMapper.toResponse(saved);
    }

    @Override
    public TaskResponse update(Long id, TaskUpdate dto) {
        Employee employee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new ResourceNotFoundException("TransportOrder not found"));

        Task task = _taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        // change history part

        if(!task.getAssignedEmployee().getId().equals(employee.getId())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TASK",
                    task.getId(),
                    ChangeType.UPDATE,
                    "assignedEmployee",
                    task.getAssignedEmployee().getId().toString(),
                    dto.getAssignedEmployeeId().toString(),
                    task.getId()
            ));
        }

        if(!task.getDueDate().equals(LocalDateTime.now())){
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TASK",
                    task.getId(),
                    ChangeType.UPDATE,
                    "dueDate",
                    task.getDueDate().toString(),
                    dto.getDueDate().toString(),
                    task.getId()
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
                    task.getId()
            ));
        }

        // end

        TaskMapper.updateEntity(task, dto, employee, transportOrder);
        Task saved =  _taskRepository.save(task);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "TASK",
                saved.getId(),
                "TASK is updated (ID: " + saved.getId() + ")",
                saved.getId()
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

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "TASK",
                id,
                "TASK is deleted (ID: " + id + ")",
                id
        ));

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "TASK",
                id,
                "TASK is created (ID: " + id + ")",
                id
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
                    throw new BadRequestException("Task is already in progress");
                }
                break;
            case IN_PROGRESS:
                if(status.equals(TaskStatus.COMPLETED) ||  status.equals(TaskStatus.CANCELLED)) {
                    task.setStatus(status);
                }
                else {
                    throw new BadRequestException("Task is already in progress");
                }
                break;
            case CANCELLED:
                throw new BadRequestException("Task is already cancelled");
            case COMPLETED:
                throw new BadRequestException("Task is already completed");
        }

        activityLogService.create(new ActivityLogCreate(
                "STATUS_CHANGE",
                "TASK",
                task.getId(),
                "TASK status changed (ID: " + task.getId() + ")",
                task.getId()
        ));

        Task saved = _taskRepository.save(task);

        activityLogService.create(new ActivityLogCreate(
                "CHANGE_STATUS",
                "TASK",
                saved.getId(),
                "TASK status is changed (ID: " + saved.getId() + ")",
                saved.getId()
        ));

        return TaskMapper.toResponse(saved);
    }

    @Override
    public TaskResponse assignTask(Long id, Long employeeId) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee employee = _employeeRepository.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        task.setAssignedEmployee(employee);

        _taskRepository.save(task);

        activityLogService.create(new ActivityLogCreate(
                "ASSIGNED",
                "TASK",
                task.getId(),
                "TASK assigned (ID: " + task.getId() + ") to employee " + employee.getId().toString(),
                task.getId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "ASSIGN",
                "TASK",
                id,
                "TASK is assigned (ID: " + id + ") to employee " + employee.getId().toString(),
                id
        ));

        return TaskMapper.toResponse(task);
    }
}
