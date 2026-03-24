package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.EmployeeMapper;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;
import rs.logistics.logistics_system.service.definition.EmployeeServiceDefinition;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService implements EmployeeServiceDefinition {

    private final EmployeeRepository _employeeRepository;
    private final TaskRepository _taskRepository;
    private final ShiftRepository _shiftRepository;
    private final UserRepository _userRepository;

    private final UserServiceDefinition userService;
    private final ActivityLogServiceDefinition activityLogService;
    private final ChangeHistoryServiceDefinition changeHistoryService;

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public EmployeeResponse create(EmployeeCreate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() ->  new ResourceNotFoundException("User not found"));
        Employee employee = EmployeeMapper.toEntity(dto, user);
        Employee saved = _employeeRepository.save(employee);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "EMPLOYEE",
                saved.getId(),
                "EMPLOYEE is created (ID: " + saved.getId() + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return EmployeeMapper.toResponse(saved);
    }

    @Override
    public EmployeeResponse update(Long id, EmployeeUpdate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() ->  new ResourceNotFoundException("User not found"));
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "EMPLOYEE",
                employee.getId(),
                "EMPLOYEE is updated (ID: " + employee.getId() + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        EmployeeMapper.updateEntity(dto, employee, user);
        Employee updated = _employeeRepository.save(employee);
        return EmployeeMapper.toResponse(updated);
    }

    @Override
    public EmployeeResponse getById(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return EmployeeMapper.toResponse(employee);
    }

    @Override
    public List<EmployeeResponse> getAll() {
        return _employeeRepository.findAll().stream().map(EmployeeMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if(employee.getShifts()!=null || employee.getTasks()!=null || employee.getTransportOrders() != null || employee.getManagedWarehouses() != null){
            throw new BadRequestException("Delete previous data in order to delete employee");
        }

        _employeeRepository.delete(employee);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "EMPLOYEE",
                id,
                "EMPLOYEE is created (ID: " + id + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    @Override
    public List<TaskResponse> getTasksByEmployeeId(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _taskRepository.findByAssignedEmployeeId(employee.getId()).stream().map(TaskMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponse> getShiftsByEmployeeId(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _shiftRepository.findByEmployeeId(id).stream().map(ShiftMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void terminateEmployee(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        User user = _userRepository.findById(employee.getUser().getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        deactivateEmployee(user.getId());
        userService.disableUser(user.getId());

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "EMPLOYEE",
                id,
                "EMPLOYEE was fired (ID: " + id + " )",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        _userRepository.save(user);
        _employeeRepository.save(employee);
    }

    private void activateEmployee(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        employee.setActive(true);
    }

    private void deactivateEmployee(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        employee.setActive(true);
    }
}
