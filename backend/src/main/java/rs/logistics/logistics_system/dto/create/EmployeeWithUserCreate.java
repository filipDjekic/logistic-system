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
import rs.logistics.logistics_system.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeWithUserCreate {

    @NotBlank
    @Size(min = 1, max = 60)
    private String firstName;

    @NotBlank
    @Size(min = 1, max = 60)
    private String lastName;

    @NotBlank
    @Size(min = 1, max = 13)
    private String jmbg;

    @NotBlank
    @Size(max = 30)
    private String phoneNumber;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @Size(max = 200)
    private String address;

    @Positive
    private Long cityId;

    @Size(max = 100)
    private String city;

    @Size(max = 20)
    private String postalCode;

    @Positive
    private Long timezoneId;

    @Positive
    private Long countryId;

    @Positive
    private Long primaryWarehouseId;

    @NotNull
    private EmployeePosition position;

    @NotNull
    private LocalDate employmentDate;

    @NotNull
    @Positive
    private BigDecimal salary;

    @NotBlank
    @Size(min = 8, max = 255)
    private String password;

    @NotNull
    @Positive
    private Long roleId;

    @NotNull
    private UserStatus status;

    @Positive
    private Long companyId;
}