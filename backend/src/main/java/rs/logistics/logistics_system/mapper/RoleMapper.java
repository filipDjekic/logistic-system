package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.RoleCreate;
import rs.logistics.logistics_system.dto.response.RoleResponse;
import rs.logistics.logistics_system.dto.update.RoleUpdate;
import rs.logistics.logistics_system.entity.Role;

public class RoleMapper {

    public static Role toEntity(RoleCreate dto){
        Role role = new Role(dto.getName(), dto.getDescription());
        return role;
    }

    public static void updateEntity(Role role, RoleUpdate dto){
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
    }

    public static RoleResponse toResponse(Role role){
        RoleResponse roleResponse = new RoleResponse(role.getId(), role.getName(), role.getDescription());
        return roleResponse;
    }
}
