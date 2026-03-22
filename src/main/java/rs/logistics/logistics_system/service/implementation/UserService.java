package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
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
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
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
    private final ActivityLogServiceDefinition activityLogService;
    private final ChangeHistoryServiceDefinition changeHistoryService;

    @Override
    public UserResponse create(UserCreate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));
        User user = UserMapper.toEntity(dto, role);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEnabled(true);
        User savedUser = _userRepository.save(user);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "USER",
                savedUser.getId(),
                "USER is created (ID: " + savedUser.getId() + ")",
                savedUser.getId()
        ));

        return UserMapper.toResponse(savedUser);
    }

    @Override
    public UserResponse update(Long id, UserUpdate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
        UserMapper.updateEntity(user, dto, role);
        User updatedUser = _userRepository.save(user);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "USER",
                updatedUser.getId(),
                "USER is updated (ID: " + updatedUser.getId() + ")",
                updatedUser.getId()
        ));

        return UserMapper.toResponse(updatedUser);
    }

    @Override
    public UserResponse getById(Long id) {
        User user  = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
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

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "USER",
                id,
                "USER is deleted (ID: " + id + ")",
                id
        ));
    }

    @Override
    public void enableUser(Long id) {
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

        if (Boolean.TRUE.equals(user.getEnabled())) {
            throw new BadRequestException("User is already enabled");
        }

        user.setEnabled(true);
        _userRepository.save(user);

        activityLogService.create(new ActivityLogCreate(
                "STATUS_CHANGE",
                "USER",
                id,
                "USER is enabled (ID: " + id + ")",
                id
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.STATUS_CHANGE,
                "enabled",
                "false",
                "true",
                id
        ));
    }

    @Override
    public void disableUser(Long id) {
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
        user.setEnabled(false);
        _userRepository.save(user);
        activityLogService.create(new ActivityLogCreate(
                "STATUS_CHANGE",
                "USER",
                id,
                "USER is disabled (ID: " + id + ")",
                id
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.STATUS_CHANGE,
                "enabled",
                "true",
                "false",
                id
        ));
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

        activityLogService.create(new ActivityLogCreate(
                "UPDATE_PASSWORD",
                "USER",
                id,
                "USER password is updated (ID: " + id + ")",
                id
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.UPDATE,
                "password",
                "[PROTECTED]",
                "[PROTECTED]",
                id
        ));
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

        activityLogService.create(new ActivityLogCreate(
                "ASSIGN_ROLE",
                "USER",
                id,
                "USER role changed from " + oldRole + " to " + newRole.getName() + " (ID: " + id + ")",
                id
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.UPDATE,
                "role",
                oldRole,
                newRole.getName(),
                id
        ));

        return UserMapper.toResponse(updatedUser);
    }

    // helpers

    private void validateUniqueEmail(String email){
        if(_userRepository.existsByEmail(email)){
            throw new BadRequestException("Email already exists");
        }
    }

    private void validateEmailForUpdate(User user, String email){
        if(!user.getEmail().equals(email) && _userRepository.existsByEmail(email)){
            throw new BadRequestException("Email already exists");
        }
    }
}
