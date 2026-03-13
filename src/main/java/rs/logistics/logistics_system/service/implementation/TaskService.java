package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService implements TaskServiceDefinition {

    private final TaskRepository _taskRepository;
    private final EmployeeRepository _employeeRepository;
    private final TransportOrderRepository _transportOrderRepository;


    @Override
    public TaskResponse create(TaskCreate dto) {

        Employee employee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new RuntimeException("Employee not found"));
        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new RuntimeException("TransportOrder not found"));

        Task task = TaskMapper.toEntity(dto, employee, transportOrder);
        Task saved =  _taskRepository.save(task);
        return TaskMapper.toResponse(saved);
    }

    @Override
    public TaskResponse update(Long id, TaskUpdate dto) {
        Employee employee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new RuntimeException("Employee not found"));
        TransportOrder transportOrder = _transportOrderRepository.findById(dto.getTransportOrderId()).orElseThrow(() -> new RuntimeException("TransportOrder not found"));

        Task task = _taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        TaskMapper.updateEntity(task, dto, employee, transportOrder);
        Task saved =  _taskRepository.save(task);
        return TaskMapper.toResponse(saved);
    }

    @Override
    public TaskResponse getById(Long id) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        return TaskMapper.toResponse(task);
    }

    @Override
    public List<TaskResponse> getAll() {
        return _taskRepository.findAll().stream().map(TaskMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Task task = _taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        _taskRepository.delete(task);
    }
}
