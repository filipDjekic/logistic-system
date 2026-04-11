package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Boolean enabled;
    private UserStatus status;
    private Long roleId;
    private String roleName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private CompanySummary company;
    private EmployeeSummary employee;

    public UserResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            Boolean enabled,
            UserStatus status,
            Long roleId,
            String roleName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CompanySummary company,
            EmployeeSummary employee
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.enabled = enabled;
        this.status = status;
        this.roleId = roleId;
        this.roleName = roleName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.company = company;
        this.employee = employee;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class CompanySummary {
        private Long id;
        private String name;
        private Boolean active;

        public CompanySummary(Long id, String name, Boolean active) {
            this.id = id;
            this.name = name;
            this.active = active;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class EmployeeSummary {
        private Long id;
        private String jmbg;
        private String phoneNumber;
        private EmployeePosition position;
        private LocalDate employmentDate;
        private BigDecimal salary;
        private Boolean active;
        private Long companyId;

        public EmployeeSummary(
                Long id,
                String jmbg,
                String phoneNumber,
                EmployeePosition position,
                LocalDate employmentDate,
                BigDecimal salary,
                Boolean active,
                Long companyId
        ) {
            this.id = id;
            this.jmbg = jmbg;
            this.phoneNumber = phoneNumber;
            this.position = position;
            this.employmentDate = employmentDate;
            this.salary = salary;
            this.active = active;
            this.companyId = companyId;
        }
    }
}