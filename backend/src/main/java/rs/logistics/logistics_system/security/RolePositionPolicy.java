package rs.logistics.logistics_system.security;

import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.exception.BadRequestException;

@Component
public class RolePositionPolicy {

    public EmployeePosition expectedPositionForRole(Role role) {
        if (role == null || role.getName() == null) {
            throw new BadRequestException("Role is required");
        }

        String roleName = RoleCatalog.normalize(role.getName());

        try {
            return EmployeePosition.valueOf(roleName);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported employee role");
        }
    }

    public void validatePositionMatchesRole(EmployeePosition position, Role role) {
        if (position == null) {
            throw new BadRequestException("Employee position is required");
        }

        EmployeePosition expected = expectedPositionForRole(role);

        if (position != expected) {
            throw new BadRequestException("Employee position must match selected role");
        }
    }
}
