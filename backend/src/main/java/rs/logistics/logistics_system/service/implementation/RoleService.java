package rs.logistics.logistics_system.service.implementation;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.RoleCreate;
import rs.logistics.logistics_system.dto.response.RoleResponse;
import rs.logistics.logistics_system.dto.update.RoleUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.RoleMapper;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.RoleServiceDefinition;

@Service
@RequiredArgsConstructor
public class RoleService implements RoleServiceDefinition {

    private final RoleRepository _roleRepository;
    private final UserRepository _userRepository;

    @Override
    public RoleResponse create(RoleCreate dto) {
        Role role = RoleMapper.toEntity(dto);
        role.setName(dto.getName().toUpperCase());
        Role savedRole = _roleRepository.save(role);
        return RoleMapper.toResponse(savedRole);
    }

    @Override
    public RoleResponse update(Long id, RoleUpdate dto) {
        Role role = _roleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Role with id not found"));

        RoleMapper.updateEntity(role, dto);
        Role updatedRole = _roleRepository.save(role);
        return RoleMapper.toResponse(updatedRole);
    }

    @Override
    public RoleResponse getById(Long id) {
        Role role = _roleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Role with id not found"));

        return RoleMapper.toResponse(role);
    }

    @Override
    public List<RoleResponse> getAll() {
        return _roleRepository.findAll().stream().map(RoleMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Role role = _roleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if ("OVERLORD".equalsIgnoreCase(role.getName())) {
            throw new BadRequestException("OVERLORD role cannot be deleted");
        }

        boolean hasAnyUsers = !_userRepository.findByRoleId(role.getId()).isEmpty();

        if (hasAnyUsers) {
            throw new BadRequestException("Role cannot be deleted because it is assigned to users. Reassign users instead.");
        }

        _roleRepository.delete(role);
    }
}
