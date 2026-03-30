package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.RoleCreate;
import rs.logistics.logistics_system.dto.response.RoleResponse;
import rs.logistics.logistics_system.dto.update.RoleUpdate;

import java.util.List;

public interface RoleServiceDefinition {

    RoleResponse create(RoleCreate dto);

    RoleResponse update(Long id, RoleUpdate dto);

    RoleResponse getById(Long id);

    List<RoleResponse> getAll();

    void delete(Long id);
}
