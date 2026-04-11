package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeePosition;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class UserEmployeeUpdate {

    @NotBlank
    @Size(min = 1, max = 13)
    private String jmbg;

    @NotBlank
    @Size(min = 1, max = 20)
    private String phoneNumber;

    @NotNull
    private EmployeePosition position;

    @NotNull
    private LocalDate employmentDate;

    @NotNull
    @Positive
    private BigDecimal salary;

    @NotNull
    private Boolean active;
}