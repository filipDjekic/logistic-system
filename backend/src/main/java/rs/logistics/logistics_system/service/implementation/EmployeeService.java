package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
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
    private final AuditFacadeDefinition auditFacade;

    @Override
    @Transactional
    public EmployeeResponse create(EmployeeCreate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateUserNotAlreadyAssigned(user.getId());

        Employee employee = EmployeeMapper.toEntity(dto, user);
        Employee saved = _employeeRepository.save(employee);

        auditFacade.recordCreate("EMPLOYEE", saved.getId());
        auditFacade.log(
                "CREATE",
                "EMPLOYEE",
                saved.getId(),
                "EMPLOYEE is created (ID: " + saved.getId() + ")"
        );

        return EmployeeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long id, EmployeeUpdate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        validateUserAssignmentForUpdate(employee, user.getId());

        Long oldUserId = employee.getUser() != null ? employee.getUser().getId() : null;
        String oldFirstName = employee.getFirstName();
        String oldLastName = employee.getLastName();
        Object oldPosition = employee.getPosition();
        String oldPhoneNumber = employee.getPhoneNumber();

        EmployeeMapper.updateEntity(dto, employee, user);
        Employee updated = _employeeRepository.save(employee);

        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "userId", oldUserId, updated.getUser() != null ? updated.getUser().getId() : null);
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "firstName", oldFirstName, updated.getFirstName());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "lastName", oldLastName, updated.getLastName());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "position", oldPosition, updated.getPosition());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "phoneNumber", oldPhoneNumber, updated.getPhoneNumber());

        auditFacade.log(
                "UPDATE",
                "EMPLOYEE",
                updated.getId(),
                "EMPLOYEE is updated (ID: " + updated.getId() + ")"
        );

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
    @Transactional
    public void delete(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        boolean hasHistory =
                (employee.getShifts() != null && !employee.getShifts().isEmpty()) ||
                        (employee.getTasks() != null && !employee.getTasks().isEmpty()) ||
                        (employee.getTransportOrders() != null && !employee.getTransportOrders().isEmpty()) ||
                        (employee.getManagedWarehouses() != null && !employee.getManagedWarehouses().isEmpty());

        if (hasHistory) {
            throw new BadRequestException("Employee cannot be deleted because related history already exists. Terminate employee instead.");
        }

        if (employee.getUser() != null) {
            throw new BadRequestException("Employee cannot be deleted while linked user exists. Disable user and terminate employee instead.");
        }

        _employeeRepository.delete(employee);

        auditFacade.recordDelete("EMPLOYEE", id);
        auditFacade.log(
                "DELETE",
                "EMPLOYEE",
                id,
                "EMPLOYEE is deleted (ID: " + id + ")"
        );
    }

    @Override
    public List<TaskResponse> getTasksByEmployeeId(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _taskRepository.findByAssignedEmployeeId(employee.getId()).stream().map(TaskMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponse> getShiftsByEmployeeId(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _shiftRepository.findByEmployeeId(employee.getId()).stream().map(ShiftMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void terminateEmployee(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (Boolean.FALSE.equals(employee.getActive())) {
            throw new BadRequestException("Employee is already inactive");
        }

        Boolean oldActive = employee.getActive();
        employee.setActive(false);
        _employeeRepository.save(employee);

        if (employee.getUser() != null) {
            userService.disableUser(employee.getUser().getId());
        }

        auditFacade.recordStatusChange("EMPLOYEE", id, "active", oldActive, employee.getActive());
        auditFacade.log(
                "TERMINATE",
                "EMPLOYEE",
                id,
                "EMPLOYEE was terminated (ID: " + id + ")"
        );
    }

    //helpers

    private void validateUserNotAlreadyAssigned(Long userId) {
        List<Employee> employees = _employeeRepository.findAll();
        boolean alreadyAssigned = employees.stream().anyMatch(employee -> employee.getUser() != null && employee.getUser().getId().equals(userId));

        if (alreadyAssigned) {
            throw new BadRequestException("Selected user is already assigned to another employee");
        }
    }

    private void validateUserAssignmentForUpdate(Employee currentEmployee, Long newUserId) {
        if (currentEmployee.getUser() != null && currentEmployee.getUser().getId().equals(newUserId)) {
            return;
        }

        List<Employee> employees = _employeeRepository.findAll();
        boolean alreadyAssigned = employees.stream().anyMatch(employee -> !employee.getId().equals(currentEmployee.getId()) && employee.getUser() != null && employee.getUser().getId().equals(newUserId));

        if (alreadyAssigned) {
            throw new BadRequestException("Selected user is already assigned to another employee");
        }
    }
}