package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.security.RoleCatalog;
import rs.logistics.logistics_system.dto.response.RoleResponse;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.RoleMapper;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.service.definition.RoleServiceDefinition;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService implements RoleServiceDefinition {

    private final RoleRepository roleRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public RoleResponse getById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role with id not found"));

        if (!isVisibleToCurrentUser(role.getName())) {
            throw new ForbiddenException("You do not have access to this role");
        }

        return RoleMapper.toResponse(role);
    }

    @Override
    public List<RoleResponse> getAll() {
        return roleRepository.findAll()
                .stream()
                .filter(role -> isVisibleToCurrentUser(role.getName()))
                .sorted(Comparator.comparing(Role::getName, String.CASE_INSENSITIVE_ORDER))
                .map(RoleMapper::toResponse)
                .collect(Collectors.toList());
    }

    private boolean isVisibleToCurrentUser(String roleName) {
        String normalizedRole = RoleCatalog.normalize(roleName);

        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        if (authenticatedUserProvider.isCompanyAdmin() || authenticatedUserProvider.hasRole(RoleCatalog.HR_MANAGER)) {
            return !RoleCatalog.OVERLORD.equals(normalizedRole)
                    && !RoleCatalog.COMPANY_ADMIN.equals(normalizedRole);
        }

        return false;
    }
}