package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoleUpdate {

    @NotBlank
    @Size(min = 1, max = 50)
    private String name;

    @Size(max = 255)
    private String description;

    public RoleUpdate(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
