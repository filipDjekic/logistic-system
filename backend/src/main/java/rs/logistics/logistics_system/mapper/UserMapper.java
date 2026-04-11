package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;

public class UserMapper {

    public static User toEntity(UserCreate dto, Role role) {
        return new User(
                dto.getPassword(),
                dto.getFirstName(),
                dto.getLastName(),
                dto.getEmail(),
                dto.getStatus(),
                role
        );
    }

    public static void updateEntity(User user, UserUpdate dto, Role role) {
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setStatus(dto.getStatus());
        user.setRole(role);
        user.setEnabled(dto.getEnabled());
    }

    public static UserResponse toResponse(User user) {
        Company company = user.getCompany();
        Employee employee = user.getEmployee();

        UserResponse.CompanySummary companySummary = company == null
                ? null
                : new UserResponse.CompanySummary(
                        company.getId(),
                        company.getName(),
                        company.getActive()
                );

        UserResponse.EmployeeSummary employeeSummary = employee == null
                ? null
                : new UserResponse.EmployeeSummary(
                        employee.getId(),
                        employee.getJmbg(),
                        employee.getPhoneNumber(),
                        employee.getPosition(),
                        employee.getEmploymentDate(),
                        employee.getSalary(),
                        employee.getActive(),
                        employee.getCompany() != null ? employee.getCompany().getId() : null
                );

        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getEnabled(),
                user.getStatus(),
                user.getRole().getId(),
                user.getRole().getName(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                companySummary,
                employeeSummary
        );
    }
}