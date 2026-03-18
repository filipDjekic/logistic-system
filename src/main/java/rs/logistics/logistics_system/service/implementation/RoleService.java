package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.RoleCreate;
import rs.logistics.logistics_system.dto.response.RoleResponse;
import rs.logistics.logistics_system.dto.update.RoleUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.RoleMapper;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.RoleServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService implements RoleServiceDefinition {

    private final RoleRepository _roleRepository;
    private final UserRepository _userRepository;

    @Override
    public RoleResponse create(RoleCreate dto) {
        Role role = RoleMapper.toEntity(dto);
        Role savedRole = _roleRepository.save(role);
        return RoleMapper.toResponse(savedRole);
    }

    @Override
    public RoleResponse update(Long id, RoleUpdate dto) {
        Role role = _roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role with id not found"));

        RoleMapper.updateEntity(role, dto);
        Role updatedRole = _roleRepository.save(role);
        return RoleMapper.toResponse(updatedRole);
    }

    @Override
    public RoleResponse getById(Long id) {
        Role role = _roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role with id not found"));

        return RoleMapper.toResponse(role);
    }

    @Override
    public List<RoleResponse> getAll() {
        return _roleRepository.findAll().stream().map(RoleMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Role role = _roleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        boolean hasActiveUsers = _userRepository.existsByRoleIdAndEnabledTrueAndStatus(role.getId(), UserStatus.ACTIVE);

        if (hasActiveUsers) {
            throw new BadRequestException("Role cannot be deleted because it is assigned to active users");
        }

        _roleRepository.delete(role);
    }
}
