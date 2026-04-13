package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class CompanyAdminCreate {

    @NotBlank
    @Size(min = 8, max = 255)
    private String password;

    @NotBlank
    @Size(min = 1, max = 60)
    private String firstName;

    @NotBlank
    @Size(min = 1, max = 60)
    private String lastName;

    @NotBlank
    @Size(min = 1, max = 13)
    private String jmbg;

    @NotBlank
    @Size(min = 1, max = 20)
    private String phoneNumber;

    @NotNull
    private LocalDate employmentDate;
}
