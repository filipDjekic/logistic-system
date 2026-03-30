package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;

public class EmployeeMapper {

    public static Employee toEntity(EmployeeCreate dto, User user) {
        Employee employee = new Employee(
                dto.getFirstName(),
                dto.getLastName(),
                dto.getJmbg(),
                dto.getPhoneNumber(),
                dto.getEmail(),
                dto.getPosition(),
                dto.getEmploymentDate(),
                dto.getSalary(),
                user
        );
        return employee;
    }

    public static void updateEntity(EmployeeUpdate dto, Employee entity, User user) {
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setJmbg(dto.getJmbg());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setEmail(dto.getEmail());
        entity.setPosition(dto.getPosition());
        entity.setEmploymentDate(dto.getEmploymentDate());
        entity.setSalary(dto.getSalary());
        entity.setUser(user);
    }

    public static EmployeeResponse toResponse(Employee employee) {
        EmployeeResponse employeeResponse = new EmployeeResponse(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getJmbg(),
                employee.getPhoneNumber(),
                employee.getEmail(),
                employee.getPosition(),
                employee.getEmploymentDate(),
                employee.getSalary(),
                employee.getUser().getId()
        );
        return employeeResponse;
    }
}
