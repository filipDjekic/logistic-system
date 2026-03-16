package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoleCreate {

    @NotBlank
    private String name;

    private String description;

    public RoleCreate(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
