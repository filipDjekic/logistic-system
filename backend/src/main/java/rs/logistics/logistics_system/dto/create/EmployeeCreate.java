package rs.logistics.logistics_system.dto.create;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    @Size(min = 1, max = 30)
    private String email;

    @NotNull
    private EmployeePosition position;

    @NotNull
    private LocalDate employmentDate;

    @NotNull
    @Positive
    private BigDecimal salary;

    @Positive
    private Long userId;

    public EmployeeCreate(String firstName,
                          String lastName,
                          String jmbg,
                          String phoneNumber,
                          String email,
                          EmployeePosition position,
                          LocalDate employmentDate,
                          BigDecimal salary,
                          Long userId) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.jmbg = jmbg;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.position = position;
        this.employmentDate = employmentDate;
        this.salary = salary;
        this.userId = userId;

    }
}
