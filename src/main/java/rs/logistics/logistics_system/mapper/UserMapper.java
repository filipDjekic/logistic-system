package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;

public class UserMapper {

    public static User toEntity(UserCreate dto, Role role){
        User user = new User(dto.getUsername(),
                dto.getPassword(),
                dto.getFirstName(),
                dto.getLastName(),
                dto.getEmail(),
                dto.getStatus(),
                role);
        return user;
    }

    public static void updateEntity(User user, UserUpdate dto, Role role){
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setStatus(dto.getStatus());
        user.setRole(role);
        user.setPassword(dto.getPassword());
        user.setEnabled(dto.getEnabled());
    }

    public static UserResponse toResponse(User user, Role role){
        UserResponse userResponse = new UserResponse(user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getEnabled(),
                user.getStatus(),
                user.getRole().getId(),
                user.getRole().getName(),
                user.getCreatedAt(),
                user.getUpdatedAt());
        return userResponse;
    }
}
