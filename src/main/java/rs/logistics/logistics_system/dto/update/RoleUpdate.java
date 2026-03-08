package rs.logistics.logistics_system.dto.update;

public class RoleUpdate {

    private String name;
    private String description;

    public RoleUpdate() {
    }

    public RoleUpdate(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
