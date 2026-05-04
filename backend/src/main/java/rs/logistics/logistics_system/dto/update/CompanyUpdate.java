package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CompanyUpdate {

    @NotBlank
    @Size(min = 1, max = 120)
    private String name;

    @NotNull
    private Boolean active;

    @NotNull
    private Long countryId;


    @NotNull
    private Long timezoneId;

    @Size(max = 200, message = "Address must be at most 200 characters")
    private String address;

    @Positive(message = "City is not valid")
    private Long cityId;

    @Size(max = 100, message = "City must be at most 100 characters")
    private String city;
    @Size(max = 20, message = "Postal code must be at most 20 characters")
    private String postalCode;

    @Size(max = 30, message = "Phone number must be at most 30 characters")
    private String phoneNumber;

    @Email(message = "Email is not valid")
    @Size(max = 255, message = "Email must be at most 255 characters")
    private String email;

    @Size(max = 40)
    private String taxNumber;

    @Size(max = 40)
    private String registrationNumber;
}
