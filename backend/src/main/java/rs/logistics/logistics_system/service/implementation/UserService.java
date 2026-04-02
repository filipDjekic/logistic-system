package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.auth.ChangePasswordRequest;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.UserMapper;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserServiceDefinition {

    private final UserRepository _userRepository;
    private final RoleRepository _roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditFacadeDefinition auditFacade;

    @Override
    public UserResponse create(UserCreate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        validateUniqueEmail(dto.getEmail());

        User user = UserMapper.toEntity(dto, role);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEnabled(true);

        User savedUser = _userRepository.save(user);

        auditFacade.recordCreate("USER", savedUser.getId());
        auditFacade.log(
                "CREATE",
                "USER",
                savedUser.getId(),
                "USER is created (ID: " + savedUser.getId() + ")"
        );

        return UserMapper.toResponse(savedUser);
    }

    @Override
    public UserResponse update(Long id, UserUpdate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

        validateEmailForUpdate(user, dto.getEmail());

        if (user.getRole().getId() == 1 && dto.getRoleId() != 1) {
            throw new BadRequestException("ADMIN can't change his role.");
        }

        validateEmailForUpdate(user, dto.getEmail());

        String oldEmail = user.getEmail();
        String oldFirstName = user.getFirstName();
        String oldLastName = user.getLastName();
        Object oldStatus = user.getStatus();
        Long oldRoleId = user.getRole() != null ? user.getRole().getId() : null;
        Boolean oldEnabled = user.getEnabled();

        UserMapper.updateEntity(user, dto, role);
        User updatedUser = _userRepository.save(user);

        auditFacade.recordFieldChange("USER", updatedUser.getId(), "email", oldEmail, updatedUser.getEmail());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "first_name", oldFirstName, updatedUser.getFirstName());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "last_name", oldLastName, updatedUser.getLastName());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "status", oldStatus, updatedUser.getStatus());
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "role_id", oldRoleId, updatedUser.getRole() != null ? updatedUser.getRole().getId() : null);
        auditFacade.recordFieldChange("USER", updatedUser.getId(), "enabled", oldEnabled, updatedUser.getEnabled());

        auditFacade.log(
                "UPDATE",
                "USER",
                id,
                "USER is updated (ID: " + updatedUser.getId() + ")"
        );

        return UserMapper.toResponse(updatedUser);
    }

    @Override
    public UserResponse getById(Long id) {
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
        return UserMapper.toResponse(user);
    }

    @Override
    public List<UserResponse> getAll() {
        return _userRepository.findAll().stream().map(UserMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        User user = getUserOrThrow(id);

        validateLastEnabledAdminNotRemoved(user);

        if (_userRepository.hasBusinessReferences(id)) {
            throw new BadRequestException("User cannot be deleted because it already has employee, history or system references. Disable user instead.");
        }

        _userRepository.delete(user);

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
        _userRepository.save(user);

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

        validateLastEnabledAdminNotRemoved(user);

        Boolean oldEnabled = user.getEnabled();
        user.setEnabled(false);
        _userRepository.save(user);

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
        _userRepository.save(user);

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

        Role newRole = _roleRepository.findById(roleId).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));

        String oldRole = user.getRole().getName();

        if (user.getRole().getId().equals(roleId)) {
            throw new BadRequestException("User already has this role");
        }

        user.setRole(newRole);
        User updatedUser = _userRepository.save(user);

        auditFacade.recordFieldChange("USER", id, "role", oldRole, newRole.getName());
        auditFacade.log(
                "ASSIGN_ROLE",
                "USER",
                id,
                "USER role changed from " + oldRole + " to " + newRole.getName() + " (ID: " + id + ")"
        );

        return UserMapper.toResponse(updatedUser);
    }

    private User getUserOrThrow(Long id) {
        return _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
    }

    private void validateUniqueEmail(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (_userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("User with this email already exists");
        }
    }

    private void validateEmailForUpdate(User user, String email) {
        String normalizedEmail = normalizeEmail(email);

        if (_userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, user.getId())) {
            throw new BadRequestException("User with this email already exists");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        return email.trim();
    }

    private void validateLastEnabledAdminNotRemoved(User user) {
        if (!isEnabledAdmin(user)) {
            return;
        }

        long enabledAdminCount = _userRepository.countByRole_NameIgnoreCaseAndEnabledTrue("ADMIN");
        if (enabledAdminCount <= 1) {
            throw new BadRequestException("Last enabled ADMIN user cannot be deleted or disabled");
        }
    }

    private boolean isEnabledAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName()) && Boolean.TRUE.equals(user.getEnabled());
    }
}