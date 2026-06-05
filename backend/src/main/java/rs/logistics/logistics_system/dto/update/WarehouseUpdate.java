package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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
public class WarehouseUpdate {

    @NotBlank
    @Size(min = 1, max = 100)
    private String name;

    @NotBlank
    @Size(min = 1, max = 200)
    private String address;

    @NotNull
    @Positive
    private Long cityId;

    @Size(min = 1, max = 200)
    private String city;
    @Size(max = 20)
    private String postalCode;

    @Positive
    private Long countryId;

    @NotNull
    @Positive
    private Long timezoneId;

    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private BigDecimal longitude;

    @NotNull
    @Positive
    private BigDecimal capacity;

    @NotNull
    private Boolean binTrackingEnabled = false;

}
