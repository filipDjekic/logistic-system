package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.hibernate.validator.internal.constraintvalidators.hv.UniqueElementsValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.auth.ChangePasswordRequest;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.ChangeType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.UserMapper;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

import java.time.LocalDateTime;
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
    public void delete(Long id) {
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

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
    public void enableUser(Long id) {
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

        if (Boolean.TRUE.equals(user.getEnabled())) {
            throw new BadRequestException("User is already enabled");
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
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new BadRequestException("User is already disabled");
        }

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
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

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
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

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

    //helpers

    private void validateUniqueEmail(String email) {
        if (_userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already exists");
        }
    }

    private void validateEmailForUpdate(User user, String email) {
        if (!user.getEmail().equals(email) && _userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already exists");
        }
    }
}
