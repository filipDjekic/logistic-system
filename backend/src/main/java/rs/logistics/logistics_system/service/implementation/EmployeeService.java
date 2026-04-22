package rs.logistics.logistics_system.service.implementation;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
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
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.EmployeeMapper;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.mapper.TaskMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.security.RoleCatalog;
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
    private final CompanyRepository _companyRepository;

    private final UserServiceDefinition userService;
    private final AuditFacadeDefinition auditFacade;
    private final PasswordEncoder passwordEncoder;

    private final AuthenticatedUserProvider authenticatedUserProvider;

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

        if (user != null) {
            employee.setCompany(user.getCompany());
        }

        if (!authenticatedUserProvider.isOverlord()) {
            Company company = authenticatedUserProvider.getAuthenticatedCompany();

            if (company == null) {
                throw new ForbiddenException("Authenticated user is not assigned to a company");
            }

            employee.setCompany(company);

            if (user != null) {
                authenticatedUserProvider.ensureCompanyAccess(
                        user.getCompany() != null ? user.getCompany().getId() : null
                );
            }
        }

        Employee saved = _employeeRepository.save(employee);

        auditFacade.recordCreate("EMPLOYEE", saved.getId(), saved.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", saved.getId(), "user_id", null, saved.getUser() != null ? saved.getUser().getId() : null);
        auditFacade.recordFieldChange("EMPLOYEE", saved.getId(), "company_id", null, saved.getCompany() != null ? saved.getCompany().getId() : null);
        auditFacade.log(
                "CREATE",
                "EMPLOYEE",
                saved.getId(),
                saved.getEmail(),
                "EMPLOYEE is created (ID: " + saved.getId() + ")"
        );

        return EmployeeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse createWithUser(EmployeeWithUserCreate dto) {
        validateUniqueJmbg(dto.getJmbg());

        Role role = _roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        validateAssignableRole(role);
        validatePositionMatchesRole(dto.getPosition(), role);

        Company company = resolveTargetCompany(dto.getCompanyId());

        String generatedEmail = generateUniqueEmail(dto.getFirstName(), dto.getLastName(), company, dto.getPosition().name());
        validateUniqueEmployeeEmail(generatedEmail);
        validateUniqueUserEmail(generatedEmail);

        User user = new User(
                passwordEncoder.encode(dto.getPassword()),
                dto.getFirstName(),
                dto.getLastName(),
                generatedEmail,
                dto.getStatus(),
                role
        );
        user.setEnabled(true);
        user.setCompany(company);

        User savedUser = _userRepository.save(user);

        Employee employee = new Employee(
                dto.getFirstName(),
                dto.getLastName(),
                dto.getJmbg(),
                dto.getPhoneNumber(),
                generatedEmail,
                dto.getPosition(),
                dto.getEmploymentDate(),
                dto.getSalary(),
                savedUser
        );
        employee.setCompany(company != null ? company : savedUser.getCompany());

        Employee savedEmployee = _employeeRepository.save(employee);

        auditFacade.recordCreate("USER", savedUser.getId(), savedUser.getEmail());
        auditFacade.recordFieldChange("USER", savedUser.getId(), "company_id", null, savedUser.getCompany() != null ? savedUser.getCompany().getId() : null);
        auditFacade.log(
                "CREATE",
                "USER",
                savedUser.getId(),
                savedUser.getEmail(),
                "USER is created through employee onboarding flow with generated email (ID: " + savedUser.getId() + ")"
        );

        auditFacade.recordCreate("EMPLOYEE", savedEmployee.getId(), savedEmployee.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", savedEmployee.getId(), "user_id", null, savedUser.getId());
        auditFacade.recordFieldChange("EMPLOYEE", savedEmployee.getId(), "company_id", null, savedEmployee.getCompany() != null ? savedEmployee.getCompany().getId() : null);
        auditFacade.log(
                "CREATE",
                "EMPLOYEE",
                savedEmployee.getId(),
                savedEmployee.getEmail(),
                "EMPLOYEE is created together with USER (ID: " + savedEmployee.getId() + ")"
        );

        return EmployeeMapper.toResponse(savedEmployee);
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long id, EmployeeUpdate dto) {
        Employee employee = getEmployeeOrThrow(id);

        User user = resolveOptionalUser(dto.getUserId());

        validateUniqueJmbgForUpdate(employee.getId(), dto.getJmbg());
        validateUniqueEmailForUpdate(employee.getId(), dto.getEmail());

        if (user != null) {
            validateUserAssignmentForUpdate(employee, user.getId());

            if (!authenticatedUserProvider.isOverlord()) {
                authenticatedUserProvider.ensureCompanyAccess(
                        user.getCompany() != null ? user.getCompany().getId() : null
                );
            }
        }

        Long oldUserId = employee.getUser() != null ? employee.getUser().getId() : null;
        String oldFirstName = employee.getFirstName();
        String oldLastName = employee.getLastName();
        Object oldPosition = employee.getPosition();
        String oldPhoneNumber = employee.getPhoneNumber();
        String oldJmbg = employee.getJmbg();
        String oldEmail = employee.getEmail();
        Boolean oldActive = employee.getActive();
        Long oldCompanyId = employee.getCompany() != null ? employee.getCompany().getId() : null;

        EmployeeMapper.updateEntity(dto, employee, user);

        if (user != null) {
            employee.setCompany(user.getCompany());
        }

        if (!authenticatedUserProvider.isOverlord()) {
            employee.setCompany(authenticatedUserProvider.getAuthenticatedCompany());
        }

        Employee updated = _employeeRepository.save(employee);

        if (Boolean.FALSE.equals(updated.getActive())
                && updated.getUser() != null
                && Boolean.TRUE.equals(updated.getUser().getEnabled())) {
            userService.disableUser(updated.getUser().getId());
        }

        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "user_id", oldUserId,
                updated.getUser() != null ? updated.getUser().getId() : null);
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "first_name", oldFirstName, updated.getFirstName());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "last_name", oldLastName, updated.getLastName());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "position", oldPosition, updated.getPosition());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "phone_number", oldPhoneNumber, updated.getPhoneNumber());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "jmbg", oldJmbg, updated.getJmbg());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "email", oldEmail, updated.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "active", oldActive, updated.getActive());
        auditFacade.recordFieldChange("EMPLOYEE", updated.getId(), "company_id", oldCompanyId,
                updated.getCompany() != null ? updated.getCompany().getId() : null);

        auditFacade.log(
                "UPDATE",
                "EMPLOYEE",
                updated.getId(),
                updated.getEmail(),
                "EMPLOYEE is updated (ID: " + updated.getId() + ")"
        );

        return EmployeeMapper.toResponse(updated);
    }

    @Override
    public EmployeeResponse getById(Long id) {
        return EmployeeMapper.toResponse(getEmployeeOrThrow(id));
    }

    @Override
    public List<EmployeeResponse> getAll() {
        List<Employee> employees = authenticatedUserProvider.isOverlord()
                ? _employeeRepository.findAll()
                : _employeeRepository.findAllByCompany_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return employees.stream()
                .map(EmployeeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Employee employee = getEmployeeOrThrow(id);

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

        auditFacade.recordDelete("EMPLOYEE", id, employee.getEmail());
        auditFacade.log(
                "DELETE",
                "EMPLOYEE",
                id,
                employee.getEmail(),
                "EMPLOYEE is deleted (ID: " + id + ")"
        );
    }

    @Override
    public List<TaskResponse> getTasksByEmployeeId(Long id) {
        Employee employee = getEmployeeOrThrow(id);

        List<?> tasks = authenticatedUserProvider.isOverlord()
                ? _taskRepository.findByAssignedEmployeeId(employee.getId())
                : _taskRepository.findByAssignedEmployeeIdAndAssignedEmployee_Company_Id(
                employee.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        );

        return tasks.stream()
                .map(task -> TaskMapper.toResponse((rs.logistics.logistics_system.entity.Task) task))
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponse> getShiftsByEmployeeId(Long id) {
        Employee employee = getEmployeeOrThrow(id);

        List<?> shifts = authenticatedUserProvider.isOverlord()
                ? _shiftRepository.findByEmployeeId(employee.getId())
                : _shiftRepository.findByEmployeeIdAndEmployee_Company_Id(
                employee.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        );

        return shifts.stream()
                .map(shift -> ShiftMapper.toResponse((rs.logistics.logistics_system.entity.Shift) shift))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void terminateEmployee(Long id) {
        Employee employee = getEmployeeOrThrow(id);

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
                employee.getEmail(),
                "EMPLOYEE was terminated (ID: " + id + ")"
        );
    }

    private User resolveOptionalUser(Long userId) {
        if (userId == null) {
            return null;
        }

        return authenticatedUserProvider.isOverlord()
                ? _userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"))
                : _userRepository.findByIdAndCompany_Id(
                userId,
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ).orElseThrow(() -> new ResourceNotFoundException("User not found"));
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

    private Employee getEmployeeOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _employeeRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }

        return _employeeRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private void validateAssignableRole(Role role) {
        if (role == null || !RoleCatalog.isSupported(role.getName())) {
            throw new BadRequestException("Unsupported system role");
        }

        String normalizedRole = RoleCatalog.normalize(role.getName());

        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        if (authenticatedUserProvider.isCompanyAdmin() || authenticatedUserProvider.hasRole(RoleCatalog.HR_MANAGER)) {
            if (RoleCatalog.OVERLORD.equals(normalizedRole) || RoleCatalog.COMPANY_ADMIN.equals(normalizedRole)) {
                throw new ForbiddenException("You cannot assign this role.");
            }

            return;
        }

        throw new ForbiddenException("You cannot assign roles.");
    }

    private void validatePositionMatchesRole(rs.logistics.logistics_system.enums.EmployeePosition position, Role role) {
        if (position == null) {
            throw new BadRequestException("Employee position is required");
        }

        String normalizedRole = RoleCatalog.normalize(role.getName());
        if (!position.name().equals(normalizedRole)) {
            throw new BadRequestException("Employee position must match selected role");
        }
    }

    private String generateUniqueEmail(String firstName, String lastName, Company company, String position) {
        String username = buildUniqueUsername(firstName, lastName);
        String companyName = company != null ? company.getName() : authenticatedUserProvider.getAuthenticatedUser().getCompany() != null
                ? authenticatedUserProvider.getAuthenticatedUser().getCompany().getName()
                : "system";
        String domain = buildCompanyDomain(companyName, position);
        String candidate = username + "@" + domain;
        int suffix = 1;

        while (_userRepository.existsByEmailIgnoreCase(candidate) || _employeeRepository.existsByEmailIgnoreCase(candidate)) {
            candidate = username + suffix + "@" + domain;
            suffix++;
        }

        return candidate;
    }

    private String buildUniqueUsername(String firstName, String lastName) {
        String base = buildBaseUsername(firstName, lastName);
        String candidate = base;
        int suffix = 1;

        while (emailLocalPartExists(candidate)) {
            candidate = base + suffix;
            suffix++;
        }

        return candidate;
    }

    private boolean emailLocalPartExists(String localPart) {
        return _userRepository.findAll().stream()
                .map(User::getEmail)
                .filter(email -> email != null && email.contains("@"))
                .map(email -> email.substring(0, email.indexOf('@')))
                .anyMatch(existing -> existing.equalsIgnoreCase(localPart));
    }

    private String buildBaseUsername(String firstName, String lastName) {
        String normalizedFirstName = normalizeForUsername(firstName, false);
        String normalizedLastName = normalizeForUsername(lastName, false);

        String joined = (normalizedFirstName + "." + normalizedLastName)
                .replaceAll("\\.+", ".")
                .replaceAll("^\\.|\\.$", "");

        if (joined.isBlank()) {
            throw new BadRequestException("Unable to generate employee username");
        }

        return joined.length() > 40 ? joined.substring(0, 40) : joined;
    }

    private String buildCompanyDomain(String companyName, String position) {
        String companySlug = normalizeForUsername(companyName, true);
        if (companySlug.isBlank()) {
            throw new BadRequestException("Unable to generate employee email domain");
        }

        String positionSlug = normalizeForUsername(position, true);
        if (positionSlug.isBlank()) {
            throw new BadRequestException("Unable to generate employee email domain");
        }

        return companySlug + "." + positionSlug + ".rs";
    }

    private String normalizeForUsername(String value, boolean allowHyphen) {
        String normalized = Normalizer.normalize(value == null ? "" : value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);

        normalized = allowHyphen
                ? normalized.replaceAll("[^a-z0-9]+", "-")
                : normalized.replaceAll("[^a-z0-9]+", ".");

        normalized = normalized
                .replaceAll("[-.]{2,}", allowHyphen ? "-" : ".")
                .replaceAll("^[-.]+|[-.]+$", "");

        return normalized;
    }


    private Company resolveTargetCompany(Long companyId) {
        if (authenticatedUserProvider.isOverlord()) {
            if (companyId == null) {
                throw new BadRequestException("Company id is required for OVERLORD.");
            }

            return _companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompany();

        if (company == null) {
            throw new ForbiddenException("Authenticated user is not assigned to a company");
        }

        return company;
    }
}
