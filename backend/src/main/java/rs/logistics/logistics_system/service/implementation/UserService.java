package rs.logistics.logistics_system.service.implementation;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.auth.ChangePasswordRequest;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.create.UserEmployeeCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserEmployeeUpdate;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.UserMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

@Service
@RequiredArgsConstructor
public class UserService implements UserServiceDefinition {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditFacadeDefinition auditFacade;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional
    public UserResponse create(UserCreate dto) {
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        validateUniqueEmail(dto.getEmail());
        validateUniqueEmployeeData(dto.getEmail(), dto.getEmployee().getJmbg(), null);

        Company company = resolveTargetCompany(dto.getCompanyId());

        User user = UserMapper.toEntity(dto, role);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEnabled(true);
        user.setCompany(company);

        User savedUser = userRepository.save(user);

        Employee employee = toEmployee(savedUser, company, dto.getEmployee());
        Employee savedEmployee = employeeRepository.save(employee);

        auditFacade.recordCreate("USER", savedUser.getId(), savedUser.getEmail());
        auditFacade.recordFieldChange("USER", savedUser.getId(), "company_id", null, company != null ? company.getId() : null);
        auditFacade.log(
                "CREATE",
                "USER",
                savedUser.getId(),
                savedUser.getEmail(),
                "USER is created together with EMPLOYEE (userId=" + savedUser.getId() + ", employeeId=" + savedEmployee.getId() + ")"
        );

        auditFacade.recordCreate("EMPLOYEE", savedEmployee.getId(), savedEmployee.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", savedEmployee.getId(), "user_id", null, savedUser.getId());
        auditFacade.recordFieldChange("EMPLOYEE", savedEmployee.getId(), "company_id", null, company != null ? company.getId() : null);

        return UserMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UserUpdate dto) {
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        User user = getUserOrThrow(id);

        validateEmailForUpdate(user, dto.getEmail());

        if (user.getRole() != null
                && "OVERLORD".equalsIgnoreCase(user.getRole().getName())
                && !user.getRole().getId().equals(dto.getRoleId())) {
            throw new BadRequestException("OVERLORD can't change role through this flow.");
        }

        String oldEmail = user.getEmail();
        String oldFirstName = user.getFirstName();
        String oldLastName = user.getLastName();
        Object oldStatus = user.getStatus();
        Long oldRoleId = user.getRole() != null ? user.getRole().getId() : null;
        Boolean oldEnabled = user.getEnabled();

        UserMapper.updateEntity(user, dto, role);

        if (!authenticatedUserProvider.isOverlord()) {
            user.setCompany(authenticatedUserProvider.getAuthenticatedCompany());
        }

        User updatedUser = userRepository.save(user);

        syncLinkedEmployee(updatedUser, dto.getEmployee());

        auditFacade.recordFieldChange("USER", updatedUser.getId(), "email", oldEmail, updatedUser.getEmail());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "first_name", oldFirstName, updatedUser.getFirstName());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "last_name", oldLastName, updatedUser.getLastName());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "status", oldStatus, updatedUser.getStatus());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "role_id", oldRoleId, updatedUser.getRole() != null ? updatedUser.getRole().getId() : null);
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "enabled", oldEnabled, updatedUser.getEnabled());

        auditFacade.log(
                "UPDATE",
                "USER",
                updatedUser.getId(),
                updatedUser.getEmail(),
                "USER is updated (ID: " + updatedUser.getId() + ")"
        );

        return UserMapper.toResponse(updatedUser);
    }

    @Override
    public UserResponse getById(Long id) {
        return UserMapper.toResponse(getUserOrThrow(id));
    }

    @Override
    public List<UserResponse> getAll() {
        List<User> users = authenticatedUserProvider.isOverlord()
                ? userRepository.findAll()
                : userRepository.findAllByCompany_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return users.stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        User user = getUserOrThrow(id);

        validateLastEnabledOverlordNotRemoved(user);

        if (userRepository.hasBusinessReferences(id)) {
            throw new BadRequestException("User cannot be deleted because it already has employee, history or system references. Disable user instead.");
        }

        userRepository.delete(user);

        auditFacade.recordDelete("USER", id);
        auditFacade.log(
                "DELETE",
                "USER",
                id,
                "USER is deleted (ID: " + id + ")"
        );
    }

    @Override
    @Transactional
    public void enableUser(Long id) {
        User user = getUserOrThrow(id);

        if (Boolean.TRUE.equals(user.getEnabled())) {
            throw new BadRequestException("User is already enabled");
        }

        if (user.getEmployee() != null && Boolean.FALSE.equals(user.getEmployee().getActive())) {
            throw new BadRequestException("Cannot enable user while linked employee is inactive");
        }

        Boolean oldEnabled = user.getEnabled();
        user.setEnabled(true);
        userRepository.save(user);

        auditFacade.recordStatusChange("USER", id, "enabled", oldEnabled, user.getEnabled());
        auditFacade.log(
                "STATUS_CHANGE",
                "USER",
                id,
                "USER is enabled (ID: " + id + ")"
        );
    }

    @Override
    public void disableUser(Long id) {
        User user = getUserOrThrow(id);

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new BadRequestException("User is already disabled");
        }

        validateLastEnabledOverlordNotRemoved(user);

        Boolean oldEnabled = user.getEnabled();
        user.setEnabled(false);
        userRepository.save(user);

        auditFacade.recordStatusChange("USER", id, "enabled", oldEnabled, user.getEnabled());
        auditFacade.log(
                "STATUS_CHANGE",
                "USER",
                id,
                "USER is disabled (ID: " + id + ")"
        );
    }

    @Override
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = getUserOrThrow(id);

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new BadRequestException("Disabled user cannot change password");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditFacade.log(
                "UPDATE_PASSWORD",
                "USER",
                id,
                "USER password is updated (ID: " + id + ")"
        );
    }

    @Override
    public UserResponse assignRole(Long id, Long roleId) {
        User user = getUserOrThrow(id);

        Role newRole = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        String oldRole = user.getRole().getName();

        if (user.getRole().getId().equals(roleId)) {
            throw new BadRequestException("User already has this role");
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        auditFacade.recordFieldChange("USER", id, "role", oldRole, newRole.getName());
        auditFacade.log(
                "ASSIGN_ROLE",
                "USER",
                id,
                "USER role changed from " + oldRole + " to " + newRole.getName() + " (ID: " + id + ")"
        );

        return UserMapper.toResponse(updatedUser);
    }

    private Employee toEmployee(User user, Company company, UserEmployeeCreate employeeData) {
        Employee employee = new Employee(
                user.getFirstName(),
                user.getLastName(),
                employeeData.getJmbg(),
                employeeData.getPhoneNumber(),
                user.getEmail(),
                employeeData.getPosition(),
                employeeData.getEmploymentDate(),
                employeeData.getSalary(),
                user
        );
        employee.setCompany(company);
        return employee;
    }

    private void syncLinkedEmployee(User user, UserEmployeeUpdate employeeDto) {
        if (employeeDto == null) {
            return;
        }

        Employee employee = user.getEmployee();

        if (employee == null) {
            throw new BadRequestException("Linked employee does not exist for this user");
        }

        validateUniqueEmployeeData(user.getEmail(), employeeDto.getJmbg(), employee.getId());

        String oldEmail = employee.getEmail();
        String oldJmbg = employee.getJmbg();
        String oldPhoneNumber = employee.getPhoneNumber();
        Object oldPosition = employee.getPosition();
        Object oldEmploymentDate = employee.getEmploymentDate();
        Object oldSalary = employee.getSalary();
        Boolean oldActive = employee.getActive();

        employee.setFirstName(user.getFirstName());
        employee.setLastName(user.getLastName());
        employee.setEmail(user.getEmail());
        employee.setJmbg(employeeDto.getJmbg());
        employee.setPhoneNumber(employeeDto.getPhoneNumber());
        employee.setPosition(employeeDto.getPosition());
        employee.setEmploymentDate(employeeDto.getEmploymentDate());
        employee.setSalary(employeeDto.getSalary());
        employee.setActive(employeeDto.getActive());
        employee.setCompany(user.getCompany());

        employeeRepository.save(employee);

        if (Boolean.FALSE.equals(employee.getActive()) && Boolean.TRUE.equals(user.getEnabled())) {
            user.setEnabled(false);
            userRepository.save(user);
        }

        auditFacade.recordFieldChange("EMPLOYEE", employee.getId(), "email", oldEmail, employee.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", employee.getId(), "jmbg", oldJmbg, employee.getJmbg());
        auditFacade.recordFieldChange("EMPLOYEE", employee.getId(), "phone_number", oldPhoneNumber, employee.getPhoneNumber());
        auditFacade.recordFieldChange("EMPLOYEE", employee.getId(), "position", oldPosition, employee.getPosition());
        auditFacade.recordFieldChange("EMPLOYEE", employee.getId(), "employment_date", oldEmploymentDate, employee.getEmploymentDate());
        auditFacade.recordFieldChange("EMPLOYEE", employee.getId(), "salary", oldSalary, employee.getSalary());
        auditFacade.recordFieldChange("EMPLOYEE", employee.getId(), "active", oldActive, employee.getActive());
    }

    private Company resolveTargetCompany(Long companyId) {
        if (authenticatedUserProvider.isOverlord()) {
            if (companyId == null) {
                throw new BadRequestException("companyId is required for OVERLORD user creation flow");
            }

            return companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompany();

        if (company == null) {
            throw new ForbiddenException("Authenticated user is not assigned to a company");
        }

        return company;
    }

    private User getUserOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
        }

        return userRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
    }

    private void validateUniqueEmail(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("User with this email already exists");
        }
    }

    private void validateEmailForUpdate(User user, String email) {
        String normalizedEmail = normalizeEmail(email);

        if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, user.getId())) {
            throw new BadRequestException("User with this email already exists");
        }
    }

    private void validateUniqueEmployeeData(String email, String jmbg, Long employeeId) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedJmbg = jmbg == null ? null : jmbg.trim();

        if (employeeId == null) {
            if (employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new BadRequestException("Employee with this email already exists");
            }

            if (employeeRepository.existsByJmbg(normalizedJmbg)) {
                throw new BadRequestException("Employee with this JMBG already exists");
            }

            return;
        }

        if (employeeRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, employeeId)) {
            throw new BadRequestException("Employee with this email already exists");
        }

        if (employeeRepository.existsByJmbgAndIdNot(normalizedJmbg, employeeId)) {
            throw new BadRequestException("Employee with this JMBG already exists");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        return email.trim().toLowerCase();
    }

    private void validateLastEnabledOverlordNotRemoved(User user) {
        if (user.getRole() == null || !"OVERLORD".equalsIgnoreCase(user.getRole().getName())) {
            return;
        }

        if (Boolean.TRUE.equals(user.getEnabled())
                && userRepository.countByRole_NameIgnoreCaseAndEnabledTrue("OVERLORD") <= 1) {
            throw new BadRequestException("At least one enabled OVERLORD must remain in the system");
        }
    }
}