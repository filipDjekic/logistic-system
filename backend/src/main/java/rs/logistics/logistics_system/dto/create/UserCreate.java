package rs.logistics.logistics_system.dto.create;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
public class UserCreate {

    @NotBlank
    @Size(min = 1, max = 255)
    private String password;

    @NotBlank
    @Size(min = 1, max = 60)
    private String firstName;

    @NotBlank
    @Size(min = 1, max = 60)
    private String lastName;

    @NotBlank
    @Email
    @Pattern(
        regexp = "^[a-zA-Z]+\\.[a-zA-Z]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}$",
        message = "Email must be in format firstName.lastName@firm.sector.countryCode"
    )
    @Size(min = 1, max = 50)
    private String email;

    @NotNull
    @Positive
    private Long roleId;

    @NotNull
    private UserStatus status;

    @Positive
    private Long companyId;

    @Valid
    @NotNull
    private UserEmployeeCreate employee;
}