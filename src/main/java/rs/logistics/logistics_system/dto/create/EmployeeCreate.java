package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.EmployeePosition;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeCreate {

    private String firstName;
    private String lastName;
    private String jmbg;
    private String phoneNumber;
    private String email;
    private EmployeePosition position;
    private LocalDate employmentDate;
    private BigDecimal salary;

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
