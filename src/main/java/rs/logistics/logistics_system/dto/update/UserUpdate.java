package rs.logistics.logistics_system.dto.update;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
public class UserUpdate {

    private String password;
    private String firstName;
    private String lastName;
    private String email;
    private Long roleId;
    private Boolean enabled;
    private UserStatus status;

    public UserUpdate(String password, String firstName, String lastName, String email, Long roleId, Boolean enabled, UserStatus status) {
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.roleId = roleId;
        this.enabled = enabled;
        this.status = status;
    }
}
