package rs.logistics.logistics_system.testsupport;

import org.springframework.test.util.ReflectionTestUtils;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class TestEntityFactory {

    private TestEntityFactory() {
    }

    public static Role role(String name) {
        Role role = new Role(name, name + " role");
        setId(role, 1L);
        return role;
    }

    public static Company company(Long id) {
        Company company = new Company();
        setId(company, id);
        company.setName("Company " + id);
        company.setActive(true);
        return company;
    }

    public static User user(Long id, String email, String roleName, Company company) {
        User user = new User("password", "Test", "User", email, UserStatus.ACTIVE, role(roleName));
        setId(user, id);
        user.setEnabled(true);
        user.setCompany(company);
        return user;
    }

    public static Employee employee(Long id, User user, Company company, EmployeePosition position) {
        Employee employee = new Employee(
                "Test",
                "Employee",
                "0101990712345",
                "+381641234567",
                user.getEmail(),
                position,
                LocalDate.of(2024, 1, 1),
                BigDecimal.valueOf(1000),
                user
        );
        setId(employee, id);
        employee.setCompany(company);
        return employee;
    }

    public static Warehouse warehouse(Long id, Company company) {
        Warehouse warehouse = new Warehouse();
        setId(warehouse, id);
        warehouse.setName("Warehouse " + id);
        warehouse.setAddress("Test address 1");
        warehouse.setCapacity(BigDecimal.valueOf(1000));
        warehouse.setStatus(WarehouseStatus.ACTIVE);
        warehouse.setCompany(company);
        warehouse.setActive(true);
        return warehouse;
    }

    public static void setId(Object target, Long id) {
        ReflectionTestUtils.setField(target, "id", id);
    }
}
