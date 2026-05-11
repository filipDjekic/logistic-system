package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.WarehouseZoneType;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseZoneUpdate {
    @NotBlank @Size(max = 40)
    private String code;
    @NotBlank @Size(max = 120)
    private String name;
    @NotNull
    private WarehouseZoneType type;
    private BigDecimal capacity;
    @NotNull
    private Boolean active;
    @Size(max = 500)
    private String description;
}
