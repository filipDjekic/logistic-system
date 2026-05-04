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
public class WarehouseUpdate {

    private Long id;

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

    private BigDecimal latitude;

    private BigDecimal longitude;

    @NotNull
    @Positive
    private BigDecimal capacity;;

    public WarehouseUpdate(Long id, String name, String address, Long cityId, String city, BigDecimal capacity) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.cityId = cityId;
        this.city = city;
        this.capacity = capacity;
    }
}
