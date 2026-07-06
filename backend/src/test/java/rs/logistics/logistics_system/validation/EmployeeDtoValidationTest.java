package rs.logistics.logistics_system.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.enums.EmployeePosition;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertTrue;

class EmployeeDtoValidationTest {

    private static jakarta.validation.ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }

    @Test
    void createEmployeeRejectsInvalidDtoFields() {
        EmployeeCreate dto = validEmployeeCreate();
        dto.setFirstName("");
        dto.setLastName(" ");
        dto.setJmbg("");
        dto.setPhoneNumber("");
        dto.setEmail("not-an-email");
        dto.setPosition(null);
        dto.setEmploymentDate(null);
        dto.setSalary(BigDecimal.ZERO);
        dto.setCompanyId(0L);
        dto.setUserId(-1L);

        Set<String> invalidFields = validator.validate(dto).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("firstName"));
        assertTrue(invalidFields.contains("lastName"));
        assertTrue(invalidFields.contains("jmbg"));
        assertTrue(invalidFields.contains("phoneNumber"));
        assertTrue(invalidFields.contains("email"));
        assertTrue(invalidFields.contains("position"));
        assertTrue(invalidFields.contains("employmentDate"));
        assertTrue(invalidFields.contains("salary"));
        assertTrue(invalidFields.contains("companyId"));
        assertTrue(invalidFields.contains("userId"));
    }

    @Test
    void createEmployeeAcceptsValidDto() {
        Set<ConstraintViolation<EmployeeCreate>> violations = validator.validate(validEmployeeCreate());

        assertTrue(violations.isEmpty());
    }

    private static EmployeeCreate validEmployeeCreate() {
        EmployeeCreate dto = new EmployeeCreate();
        dto.setFirstName("Marko");
        dto.setLastName("Markovic");
        dto.setJmbg("1234567890123");
        dto.setPhoneNumber("+38164111222");
        dto.setEmail("marko.markovic@test.local");
        dto.setAddress("Warehouse street 1");
        dto.setCity("Belgrade");
        dto.setPostalCode("11000");
        dto.setPrimaryWarehouseId(1L);
        dto.setPosition(EmployeePosition.WORKER);
        dto.setEmploymentDate(LocalDate.now().minusDays(1));
        dto.setSalary(new BigDecimal("80000"));
        dto.setUserId(1L);
        dto.setCompanyId(1L);
        return dto;
    }
}
