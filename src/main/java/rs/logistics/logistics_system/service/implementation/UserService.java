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

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public UserResponse create(UserCreate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));
        validateUniqueEmail(dto.getEmail());
        User user = UserMapper.toEntity(dto, role);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEnabled(true);
        User savedUser = _userRepository.save(user);

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                savedUser.getId(),
                ChangeType.CREATE,
                "ENTITY",
                "null",
                "INITIAL_STATE",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "USER",
                savedUser.getId(),
                "USER is created (ID: " + savedUser.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return UserMapper.toResponse(savedUser);
    }

    @Override
    public UserResponse update(Long id, UserUpdate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

        if(user.getRole().getId() == 1 && dto.getRoleId()!=1){
            throw new BadRequestException("ADMIN can't change his role.");
        }

        validateEmailForUpdate(user,  dto.getEmail());

        if(user.getEmail().equals(dto.getEmail())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "USER",
                    id,
                    ChangeType.UPDATE,
                    "email",
                    user.getEmail(),
                    dto.getEmail(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if(user.getFirstName().equals(dto.getFirstName())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "USER",
                    id,
                    ChangeType.UPDATE,
                    "first_name",
                    user.getFirstName(),
                    dto.getFirstName(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }
        if(user.getLastName().equals(dto.getLastName())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "USER",
                    id,
                    ChangeType.UPDATE,
                    "last_name",
                    user.getLastName(),
                    dto.getLastName(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if(user.getStatus().equals(dto.getStatus())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "USER",
                    id,
                    ChangeType.UPDATE,
                    "status",
                    user.getStatus().toString(),
                    dto.getStatus().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if(user.getRole().getId().equals(dto.getRoleId())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "USER",
                    id,
                    ChangeType.UPDATE,
                    "role_id",
                    user.getRole().getId().toString(),
                    dto.getRoleId().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if(user.getEnabled().equals(dto.getEnabled())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "USER",
                    id,
                    ChangeType.UPDATE,
                    "enabled",
                    user.getEnabled().toString(),
                    dto.getEnabled().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        UserMapper.updateEntity(user, dto, role);
        User updatedUser = _userRepository.save(user);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "USER",
                id,
                "USER is updated (ID: " + updatedUser.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
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

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.DELETE,
                "ENTITY",
                "STATE",
                "null",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "USER",
                id,
                "USER is deleted (ID: " + id + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
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
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.STATUS_CHANGE,
                "enabled",
                "false",
                "true",
                authenticatedUserProvider.getAuthenticatedUserId()
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
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.STATUS_CHANGE,
                "enabled",
                "true",
                "false",
                authenticatedUserProvider.getAuthenticatedUserId()
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
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.UPDATE,
                "password",
                "[PROTECTED]",
                "[PROTECTED]",
                authenticatedUserProvider.getAuthenticatedUserId()
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
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.UPDATE,
                "role",
                oldRole,
                newRole.getName(),
                authenticatedUserProvider.getAuthenticatedUserId()
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
