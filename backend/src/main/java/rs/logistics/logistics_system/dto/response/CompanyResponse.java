package rs.logistics.logistics_system.dto.response;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CompanyResponse {

    private Long id;
    private String name;
    private Boolean active;

    private Long countryId;
    private String countryCode;
    private String countryName;

    private String currencyCode;
    private String currencyName;
    private String phoneCode;

    private Long timezoneId;
    private String timezoneName;
    private String timezoneDisplayName;

    private String timezone;
    private String effectiveCurrencyCode;
    private String effectivePhoneCode;
    private String effectiveTimezone;

    private String address;
    private Long cityId;
    private String cityName;
    private String city;
    private String postalCode;
    private String phoneNumber;
    private String email;
    private String taxNumber;
    private String registrationNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long adminUserId;
    private Long adminEmployeeId;
    private String adminFullName;
    private String adminEmail;
}