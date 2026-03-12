package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Role;

import java.util.List;

public interface UserServiceDefinition {

    UserResponse create(UserCreate dto);

    UserResponse update(Long id, UserUpdate dto);

    UserResponse getById(Long id);

    List<UserResponse> getAll();

    void delete(Long id);
}
