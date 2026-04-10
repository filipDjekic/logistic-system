package rs.logistics.logistics_system.service.implementation;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.create.EmployeeWithUserCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.EmployeeMapper;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.EmployeeServiceDefinition;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

@Service
@RequiredArgsConstructor
public class EmployeeService implements EmployeeServiceDefinition {

    private final EmployeeRepository _employeeRepository;
    private final TaskRepository _taskRepository;
    private final ShiftRepository _shiftRepository;
    private final UserRepository _userRepository;
    private final RoleRepository _roleRepository;

    private final UserServiceDefinition userService;
    private final AuditFacadeDefinition auditFacade;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public EmployeeResponse create(EmployeeCreate dto) {
        User user = resolveOptionalUser(dto.getUserId());

        validateUniqueJmbg(dto.getJmbg());
        validateUniqueEmployeeEmail(dto.getEmail());

        if (user != null) {
            validateUserNotAlreadyAssigned(user.getId());
        }

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
    public EmployeeResponse createWithUser(EmployeeWithUserCreate dto) {
        validateUniqueJmbg(dto.getJmbg());
        validateUniqueEmployeeEmail(dto.getEmail());
        validateUniqueUserEmail(dto.getEmail());

        Role role = _roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        User user = new User(
                passwordEncoder.encode(dto.getPassword()),
                dto.getFirstName(),
                dto.getLastName(),
                dto.getEmail(),
                dto.getStatus(),
                role
        );
        user.setEnabled(true);

        User savedUser = _userRepository.save(user);

        Employee employee = new Employee(
                dto.getFirstName(),
                dto.getLastName(),
                dto.getJmbg(),
                dto.getPhoneNumber(),
                dto.getEmail(),
                dto.getPosition(),
                dto.getEmploymentDate(),
                dto.getSalary(),
                savedUser
        );

        Employee savedEmployee = _employeeRepository.save(employee);

        auditFacade.recordCreate("USER", savedUser.getId());
        auditFacade.log(
                "CREATE",
                "USER",
                savedUser.getId(),
                "USER is created through employee onboarding flow (ID: " + savedUser.getId() + ")"
        );

        auditFacade.recordCreate("EMPLOYEE", savedEmployee.getId());
        auditFacade.log(
                "CREATE",
                "EMPLOYEE",
                savedEmployee.getId(),
                "EMPLOYEE is created together with USER (ID: " + savedEmployee.getId() + ")"
        );

        auditFacade.recordFieldChange("EMPLOYEE", savedEmployee.getId(), "userId", null, savedUser.getId());

        return EmployeeMapper.toResponse(savedEmployee);
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long id, EmployeeUpdate dto) {
        Employee employee = _employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        User user = resolveOptionalUser(dto.getUserId());

        validateUniqueJmbgForUpdate(employee.getId(), dto.getJmbg());
        validateUniqueEmailForUpdate(employee.getId(), dto.getEmail());

        if (user != null) {
            validateUserAssignmentForUpdate(employee, user.getId());
        }

        Long oldUserId = employee.getUser() != null ? employee.getUser().getId() : null;
        String oldFirstName = employee.getFirstName();
        String oldLastName = employee.getLastName();
        Object oldPosition = employee.getPosition();
        String oldPhoneNumber = employee.getPhoneNumber();
        String oldJmbg = employee.getJmbg();
        String oldEmail = employee.getEmail();
        Boolean oldActive = employee.getActive();

        EmployeeMapper.updateEntity(dto, employee, user);
        Employee updated = _employeeRepository.save(employee);

        if (Boolean.FALSE.equals(updated.getActive())
                && updated.getUser() != null
                && Boolean.TRUE.equals(updated.getUser().getEnabled())) {
            userService.disableUser(updated.getUser().getId());
        }

        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "userId", oldUserId,
                updated.getUser() != null ? updated.getUser().getId() : null);
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "firstName", oldFirstName, updated.getFirstName());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "lastName", oldLastName, updated.getLastName());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "position", oldPosition, updated.getPosition());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "phoneNumber", oldPhoneNumber, updated.getPhoneNumber());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "jmbg", oldJmbg, updated.getJmbg());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "email", oldEmail, updated.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "active", oldActive, updated.getActive());

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
        Employee employee = _employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return EmployeeMapper.toResponse(employee);
    }

    @Override
    public List<EmployeeResponse> getAll() {
        return _employeeRepository.findAll()
                .stream()
                .map(EmployeeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Employee employee = _employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        boolean hasHistory =
                (employee.getShifts() != null && !employee.getShifts().isEmpty()) ||
                        (employee.getTasks() != null && !employee.getTasks().isEmpty()) ||
                        (employee.getTransportOrders() != null && !employee.getTransportOrders().isEmpty()) ||
                        (employee.getManagedWarehouses() != null && !employee.getManagedWarehouses().isEmpty());

        if (hasHistory) {
            throw new BadRequestException(
                    "Employee cannot be deleted because related history already exists. Terminate employee instead."
            );
        }

        if (employee.getUser() != null) {
            throw new BadRequestException(
                    "Employee cannot be deleted while linked user exists. Unlink user first or terminate employee instead."
            );
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
        Employee employee = _employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _taskRepository.findByAssignedEmployeeId(employee.getId())
                .stream()
                .map(TaskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponse> getShiftsByEmployeeId(Long id) {
        Employee employee = _employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _shiftRepository.findByEmployeeId(employee.getId())
                .stream()
                .map(ShiftMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void terminateEmployee(Long id) {
        Employee employee = _employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (Boolean.FALSE.equals(employee.getActive())) {
            throw new BadRequestException("Employee is already inactive");
        }

        Boolean oldActive = employee.getActive();
        employee.setActive(false);
        _employeeRepository.save(employee);

        if (employee.getUser() != null && Boolean.TRUE.equals(employee.getUser().getEnabled())) {
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

    private User resolveOptionalUser(Long userId) {
        if (userId == null) {
            return null;
        }

        return _userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateUserNotAlreadyAssigned(Long userId) {
        if (_employeeRepository.existsByUser_Id(userId)) {
            throw new BadRequestException("Selected user is already assigned to another employee");
        }
    }

    private void validateUserAssignmentForUpdate(Employee currentEmployee, Long newUserId) {
        if (currentEmployee.getUser() != null && currentEmployee.getUser().getId().equals(newUserId)) {
            return;
        }

        if (_employeeRepository.existsByUser_IdAndIdNot(newUserId, currentEmployee.getId())) {
            throw new BadRequestException("Selected user is already assigned to another employee");
        }
    }

    private void validateUniqueJmbg(String jmbg) {
        String normalizedJmbg = normalizeJmbg(jmbg);

        if (_employeeRepository.existsByJmbg(normalizedJmbg)) {
            throw new BadRequestException("Employee with this JMBG already exists");
        }
    }

    private void validateUniqueJmbgForUpdate(Long employeeId, String jmbg) {
        String normalizedJmbg = normalizeJmbg(jmbg);

        if (_employeeRepository.existsByJmbgAndIdNot(normalizedJmbg, employeeId)) {
            throw new BadRequestException("Employee with this JMBG already exists");
        }
    }

    private void validateUniqueEmployeeEmail(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (_employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("Employee with this email already exists");
        }
    }

    private void validateUniqueEmailForUpdate(Long employeeId, String email) {
        String normalizedEmail = normalizeEmail(email);

        if (_employeeRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, employeeId)) {
            throw new BadRequestException("Employee with this email already exists");
        }
    }

    private void validateUniqueUserEmail(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (_userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("User with this email already exists");
        }
    }

    private String normalizeJmbg(String jmbg) {
        if (jmbg == null || jmbg.isBlank()) {
            throw new BadRequestException("JMBG is required");
        }

        return jmbg.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        return email.trim().toLowerCase();
    }
}