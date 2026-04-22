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
    @Size(min = 1, max = 30)
    private String firstName;

    @NotBlank
    @Size(min = 1, max = 30)
    private String lastName;

    @NotBlank
    @Size(min = 1, max = 13)
    private String jmbg;

    @NotBlank
    @Size(min = 1, max = 20)
    private String phoneNumber;

    @NotBlank
    @Email
    @Size(min = 1, max = 50)
    private String email;

    @NotNull
    private EmployeePosition position;

    @NotNull
    private LocalDate employmentDate;

    @NotNull
    @Positive
    private BigDecimal salary;

    @NotBlank
    @Size(min = 1, max = 255)
    private String password;

    @NotNull
    @Positive
    private Long roleId;

    @NotNull
    private UserStatus status;

    @Positive
    private Long companyId;

    public EmployeeWithUserCreate(String firstName,
                                  String lastName,
                                  String jmbg,
                                  String phoneNumber,
                                  String email,
                                  EmployeePosition position,
                                  LocalDate employmentDate,
                                  BigDecimal salary,
                                  String password,
                                  Long roleId,
                                  UserStatus status,
                                  Long companyId) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.jmbg = jmbg;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.position = position;
        this.employmentDate = employmentDate;
        this.salary = salary;
        this.password = password;
        this.roleId = roleId;
        this.status = status;
        this.companyId = companyId;
    }
}