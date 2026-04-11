package rs.logistics.logistics_system.dto.create;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CompanyCreate {

    @NotBlank
    @Size(min = 1, max = 120)
    private String name;

    @Valid
    @NotNull
    private CompanyAdminCreate admin;
}