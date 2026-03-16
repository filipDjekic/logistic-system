package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.UserMapper;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserServiceDefinition {

    private final UserRepository _userRepository;
    private final RoleRepository _roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse create(UserCreate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));
        User user = UserMapper.toEntity(dto, role);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        User savedUser = _userRepository.save(user);
        return UserMapper.toResponse(savedUser);
    }

    @Override
    public UserResponse update(Long id, UserUpdate dto) {
        Role role = _roleRepository.findById(dto.getRoleId()).orElseThrow(() -> new ResourceNotFoundException("Role Not Found"));
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User with id not found"));
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        UserMapper.updateEntity(user, dto, role);
        User updatedUser = _userRepository.save(user);
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
    }
}
