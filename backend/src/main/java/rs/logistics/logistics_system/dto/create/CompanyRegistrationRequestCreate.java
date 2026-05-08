package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class CompanyRegistrationRequestCreate {

    @NotBlank
    @Size(max = 120)
    private String companyName;

    @Size(max = 40)
    private String registrationNumber;

    @Size(max = 40)
    private String taxNumber;

    @Email
    @Size(max = 255)
    private String companyEmail;

    @Size(max = 30)
    private String companyPhoneNumber;

    @NotNull
    @Positive
    private Long countryId;

    @NotNull
    @Positive
    private Long cityId;

    @NotNull
    @Positive
    private Long timezoneId;

    @Size(max = 200)
    private String address;

    @Size(max = 20)
    private String postalCode;

    @NotBlank
    @Size(max = 60)
    private String adminFirstName;

    @NotBlank
    @Size(max = 60)
    private String adminLastName;

    @NotBlank
    @Email
    @Size(max = 255)
    private String adminEmail;

    @NotBlank
    @Size(max = 30)
    private String adminPhoneNumber;

    @NotBlank
    @Size(max = 13)
    private String adminJmbg;

    @NotBlank
    @Size(min = 8, max = 255)
    private String adminPassword;

    @NotNull
    private LocalDate adminEmploymentDate;

    @Size(max = 1000)
    private String notes;
}
