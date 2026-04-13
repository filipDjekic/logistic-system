package rs.logistics.logistics_system.dto.update;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
public class UserUpdate {

    private Long id;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    @Email
    private String email;

    @NotNull
    private Long roleId;

    @NotNull
    private Boolean enabled;

    @NotNull
    private UserStatus status;

    @Valid
    private UserEmployeeUpdate employee;
}