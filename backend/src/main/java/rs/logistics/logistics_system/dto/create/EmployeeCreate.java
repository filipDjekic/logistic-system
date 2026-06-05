package rs.logistics.logistics_system.dto.create;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeePosition;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeCreate {

    @NotBlank
    @Size(max = 60, message = "First name must be at most 60 characters")
    private String firstName;

    @NotBlank
    @Size(max = 60, message = "Last name must be at most 60 characters")
    private String lastName;

    @NotBlank
    @Size(min = 1, max = 13)
    private String jmbg;

    @NotBlank
    @Size(max = 30, message = "Phone number must be at most 30 characters")
    private String phoneNumber;

    @NotBlank
    @jakarta.validation.constraints.Email(message = "Email is not valid")
    @Size(max = 255, message = "Email must be at most 255 characters")
    private String email;
    @Size(max = 200, message = "Address must be at most 200 characters")
    private String address;

    @Positive(message = "City is not valid")
    private Long cityId;

    @Size(max = 100, message = "City must be at most 100 characters")
    private String city;

    @Size(max = 20, message = "Postal code must be at most 20 characters")
    private String postalCode;

    @Positive(message = "Timezone is not valid")
    private Long timezoneId;

    @Positive(message = "Country is not valid")
    private Long countryId;

    @Positive(message = "Primary warehouse is not valid")
    private Long primaryWarehouseId;


    @NotNull
    private EmployeePosition position;

    @NotNull
    private LocalDate employmentDate;

    @NotNull
    @Positive
    private BigDecimal salary;

    @Positive
    private Long userId;

    @Positive
    private Long companyId;

    public EmployeeCreate(String firstName,
                        String lastName,
                        String jmbg,
                        String phoneNumber,
                        String email,
                        String address,
                        Long cityId,
                        String city,
                        String postalCode,
                        Long timezoneId,
                        Long countryId,
                        Long primaryWarehouseId,
                        EmployeePosition position,
                        LocalDate employmentDate,
                        BigDecimal salary,
                        Long userId,
                        Long companyId) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.jmbg = jmbg;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.address = address;
        this.cityId = cityId;
        this.city = city;
        this.postalCode = postalCode;
        this.timezoneId = timezoneId;
        this.countryId = countryId;
        this.primaryWarehouseId = primaryWarehouseId;
        this.position = position;
        this.employmentDate = employmentDate;
        this.salary = salary;
        this.userId = userId;
        this.companyId = companyId;
    }
}
