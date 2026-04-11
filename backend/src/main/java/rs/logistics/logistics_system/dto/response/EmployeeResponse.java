package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeePosition;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String jmbg;
    private String phoneNumber;
    private String email;
    private EmployeePosition position;
    private LocalDate employmentDate;
    private BigDecimal salary;
    private Boolean active;
    private Long userId;
    private Long companyId;
    private String companyName;

    public EmployeeResponse(
            Long id,
            String firstName,
            String lastName,
            String jmbg,
            String phoneNumber,
            String email,
            EmployeePosition position,
            LocalDate employmentDate,
            BigDecimal salary,
            Boolean active,
            Long userId,
            Long companyId,
            String companyName
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.jmbg = jmbg;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.position = position;
        this.employmentDate = employmentDate;
        this.salary = salary;
        this.active = active;
        this.userId = userId;
        this.companyId = companyId;
        this.companyName = companyName;
    }
}