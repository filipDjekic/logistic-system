package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseResponse {

    private Long id;
    private String name;
    private String address;
    private Long cityId;
    private String cityName;
    private String city;
    private String postalCode;
    private Long countryId;
    private String countryCode;
    private String countryName;
    private Long timezoneId;
    private String timezoneName;
    private String timezoneDisplayName;
    private String timezone;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal capacity;
    private WarehouseStatus status;
    private Boolean active;
    private Boolean binTrackingEnabled;

    private Long employeeId;
    private String managerName;

    private Long companyId;
    private String companyName;

    public WarehouseResponse(
            Long id,
            String name,
            String address,
            String city,
            BigDecimal capacity,
            WarehouseStatus status,
            Boolean active,
            Long employeeId,
            String managerName,
            Long companyId,
            String companyName
    ) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.city = city;
        this.capacity = capacity;
        this.status = status;
        this.active = active;
        this.employeeId = employeeId;
        this.managerName = managerName;
        this.companyId = companyId;
        this.companyName = companyName;
    }
}