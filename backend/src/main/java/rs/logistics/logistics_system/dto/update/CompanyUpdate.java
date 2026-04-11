package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CompanyUpdate {

    @NotBlank
    @Size(min = 1, max = 120)
    private String name;

    @NotNull
    private Boolean active;

    public CompanyUpdate(String name, Boolean active) {
        this.name = name;
        this.active = active;
    }
}