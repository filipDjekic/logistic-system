package rs.logistics.logistics_system.dto.response;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
public class ProfileResponse {

    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private Boolean enabled;
    private UserStatus userStatus;
    private String role;

    private Long companyId;
    private String companyName;
    private Boolean companyActive;

    private Long employeeId;
    private String employeeFirstName;
    private String employeeLastName;
    private String maskedJmbg;
    private String phoneCode;
    private String phoneNumber;
    private String employeeEmail;
    private String address;
    private Long cityId;
    private String cityName;
    private String postalCode;
    private Long countryId;
    private String countryCode;
    private String countryName;
    private Long timezoneId;
    private String timezoneName;
    private String timezoneDisplayName;
    private EmployeePosition position;
    private LocalDate employmentDate;
    private Boolean active;

    private Long primaryWarehouseId;
    private String primaryWarehouseName;
    private Long primaryWarehouseCompanyId;
    private String primaryWarehouseCompanyName;
}
