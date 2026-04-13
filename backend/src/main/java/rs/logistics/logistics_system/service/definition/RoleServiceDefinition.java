package rs.logistics.logistics_system.service.definition;

import java.util.List;

import rs.logistics.logistics_system.dto.response.RoleResponse;

public interface RoleServiceDefinition {

    RoleResponse getById(Long id);

    List<RoleResponse> getAll();
}