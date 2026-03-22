package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.UserStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Boolean enabled;
    private UserStatus status;

    private Long roleId;
    private String roleName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UserResponse(Long id, String firstName, String lastName, String email,
                           Boolean enabled, UserStatus status, Long roleId, String roleName,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.enabled = enabled;
        this.status = status;
        this.roleId = roleId;
        this.roleName = roleName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
