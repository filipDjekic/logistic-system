package rs.logistics.logistics_system.dto.auth;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {
    @NotBlank
    @Size(min = 6, max = 255)
    private String currentPassword;

    @NotBlank
    @Size(min = 6, max = 255)
    private String newPassword;

    @NotBlank
    @Size(min = 6, max = 255)
    private String confirmNewPassword;
}
