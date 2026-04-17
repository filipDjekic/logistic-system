package rs.logistics.logistics_system.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {

    @NotBlank
    @Email
    @Pattern(
        regexp = "^[a-zA-Z]+\\.[a-zA-Z]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}$",
        message = "Email must be in format firstName.lastName@firm.sector.countryCode"
    )
    private String email;

    @NotBlank
    @Size(min = 1, max = 255)
    private String password;
}
