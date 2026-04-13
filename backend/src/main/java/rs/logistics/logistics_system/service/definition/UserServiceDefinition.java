package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.auth.ChangePasswordRequest;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;

import java.util.List;

public interface UserServiceDefinition {

    UserResponse create(UserCreate dto);

    UserResponse update(Long id, UserUpdate dto);

    UserResponse getById(Long id);

    List<UserResponse> getAll();

    void delete(Long id);

    void enableUser(Long id);

    void disableUser(Long id);

    void changePassword(Long id, ChangePasswordRequest request);

    UserResponse assignRole(Long id, Long roleId);

}
