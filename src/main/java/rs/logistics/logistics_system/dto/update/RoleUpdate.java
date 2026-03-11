package rs.logistics.logistics_system.dto.update;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoleUpdate {

    private String name;
    private String description;

    public RoleUpdate(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
