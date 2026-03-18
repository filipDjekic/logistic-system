package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.ChangeType;
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
        User savedUser = _userRepository.save(user);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "USER",
                savedUser.getId(),
                "USER is created (ID: " + savedUser.getId() + ")",
                LocalDateTime.now(),
                savedUser.getId()
        ));

        return UserMapper.toResponse(savedUser);
    }

    @Override
    public UserResponse update(Long id, UserUpdate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        UserMapper.updateEntity(user, dto, role);
        User updatedUser = _userRepository.save(user);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "USER",
                updatedUser.getId(),
                "USER is updated (ID: " + updatedUser.getId() + ")",
                LocalDateTime.now(),
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
                LocalDateTime.now(),
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
                LocalDateTime.now(),
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
    public void changePassword(Long id, String newPassword) {
        User user =  _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));

        String oldPassword = user.getPassword();

        user.setPassword(passwordEncoder.encode(newPassword));
        _userRepository.save(user);
        activityLogService.create(new ActivityLogCreate(
                "UPDATE_PASSWORD",
                "USER",
                id,
                "USER password is updated (ID: " + id + ")",
                LocalDateTime.now(),
                id
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "USER",
                id,
                ChangeType.UPDATE,
                "password",
                oldPassword,
                newPassword,
                id
        ));
    }
}
