package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.CompanyCreate;
import rs.logistics.logistics_system.dto.response.CompanyResponse;
import rs.logistics.logistics_system.dto.update.CompanyUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;

public class CompanyMapper {

    public static Company toEntity(CompanyCreate dto) {
        return new Company(dto.getName());
    }

    public static void updateEntity(Company company, CompanyUpdate dto) {
        company.setName(dto.getName());
        company.setActive(dto.getActive());
    }

    public static CompanyResponse toResponse(Company company) {
        User adminUser = company.getUsers()
                .stream()
                .filter(user -> user.getRole() != null && "COMPANY_ADMIN".equalsIgnoreCase(user.getRole().getName()))
                .findFirst()
                .orElse(null);

        Employee adminEmployee = adminUser != null ? adminUser.getEmployee() : null;

        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getActive(),
                company.getCreatedAt(),
                company.getUpdatedAt(),
                adminUser != null ? adminUser.getId() : null,
                adminEmployee != null ? adminEmployee.getId() : null
        );
    }
}