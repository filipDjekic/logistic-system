package rs.logistics.logistics_system.dto.create;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.WarehouseStatus;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseCreate {

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
    private BigDecimal capacity;

    @NotNull
    private WarehouseStatus status;

    @NotNull
    @Positive
    private Long employeeId;

    @Positive
    private Long companyId;

    public WarehouseCreate(String name,
                        String address,
                        Long cityId,
                        String city,
                        String postalCode,
                        Long countryId,
                        Long timezoneId,
                        BigDecimal latitude,
                        BigDecimal longitude,
                        BigDecimal capacity,
                        WarehouseStatus status,
                        Long employeeId,
                        Long companyId) {
        this.name = name;
        this.address = address;
        this.cityId = cityId;
        this.city = city;
        this.postalCode = postalCode;
        this.countryId = countryId;
        this.timezoneId = timezoneId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.capacity = capacity;
        this.status = status;
        this.employeeId = employeeId;
        this.companyId = companyId;
    }
}