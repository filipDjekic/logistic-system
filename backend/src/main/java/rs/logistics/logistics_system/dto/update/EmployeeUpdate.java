package rs.logistics.logistics_system.dto.update;

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
public class EmployeeUpdate {

    @NotBlank(message = "First name is required")
    @Size(max = 60, message = "First name must be at most 60 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 60, message = "Last name must be at most 60 characters")
    private String lastName;

    @NotBlank(message = "JMBG is required")
    @Size(max = 13, message = "JMBG must be at most 13 characters")
    private String jmbg;

    @NotBlank(message = "Phone number is required")
    @Size(max = 30, message = "Phone number must be at most 30 characters")
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is not valid")
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


    @NotNull(message = "Position is required")
    private EmployeePosition position;

    @NotNull(message = "Employment date is required")
    private LocalDate employmentDate;

    @NotNull(message = "Salary is required")
    @Positive(message = "Salary must be greater than 0")
    private BigDecimal salary;

    @Positive(message = "Selected user is not valid")
    private Long userId;

    public EmployeeUpdate(String firstName,
                          String lastName,
                          String jmbg,
                          String phoneNumber,
                          String email,
                          EmployeePosition position,
                          LocalDate employmentDate,
                          BigDecimal salary) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.jmbg = jmbg;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.position = position;
        this.employmentDate = employmentDate;
        this.salary = salary;
    }
}
