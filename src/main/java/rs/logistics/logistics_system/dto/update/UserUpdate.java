package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
public class UserUpdate {

    @NotBlank
    @Size(min = 1, max = 60)
    private String firstName;

    @NotBlank
    @Size(min = 1, max = 60)
    private String lastName;

    @NotBlank
    @Email
    @Pattern(
            regexp = "^[a-z]+\\.[a-z]+@[a-z]+\\.[a-z]+\\.[a-z]{2,}$",
            message = "Email must be in format firstName.lastName@firm.sector.countryCode"
    )
    @Size(min = 1, max = 50)
    private String email;

    @NotNull
    private Long roleId;

    @NotNull
    private Boolean enabled;

    @NotNull
    private UserStatus status;

    public UserUpdate(String firstName, String lastName, String email, Long roleId, Boolean enabled, UserStatus status) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.roleId = roleId;
        this.enabled = enabled;
        this.status = status;
    }
}
