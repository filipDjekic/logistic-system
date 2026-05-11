package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class BinLocationUpdate {
    @NotNull @Positive
    private Long zoneId;
    @NotBlank @Size(max = 60)
    private String code;
    @NotBlank @Size(max = 120)
    private String name;
    private BigDecimal capacity;
    @NotNull
    private Boolean active;
    @Size(max = 500)
    private String description;
}
