package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class CompanyRegistrationRequestResponse {
    private Long id;
    private String companyName;
    private String registrationNumber;
    private String taxNumber;
    private String companyEmail;
    private String companyPhoneNumber;
    private Long countryId;
    private String countryName;
    private String countryCode;
    private Long cityId;
    private String cityName;
    private Long timezoneId;
    private String timezoneName;
    private String timezoneDisplayName;
    private String address;
    private String postalCode;
    private String adminFirstName;
    private String adminLastName;
    private String adminEmail;
    private String adminPhoneNumber;
    private String adminJmbg;
    private LocalDate adminEmploymentDate;
    private CompanyRegistrationRequestStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private String reviewedByEmail;
    private String rejectionReason;
    private String notes;
    private Long createdCompanyId;
    private LocalDateTime updatedAt;
}
