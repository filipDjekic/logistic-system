package rs.logistics.logistics_system.dto.create;

import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.EmployeePosition;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    public EmployeeCreate() {}

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

    public String getFirstName() {
        return firstName;
    }
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getJmbg() {
        return jmbg;
    }
    public void setJmbg(String jmbg) {
        this.jmbg = jmbg;
    }
    public String getPhoneNumber() {
        return phoneNumber;
    }
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public EmployeePosition getPosition() {
        return position;
    }
    public void setPosition(EmployeePosition position) {
        this.position = position;
    }
    public LocalDate getEmploymentDate() {
        return employmentDate;
    }
    public void setEmploymentDate(LocalDate employmentDate) {
        this.employmentDate = employmentDate;
    }
    public BigDecimal getSalary() {
        return salary;
    }
    public void setSalary(BigDecimal salary) {
        this.salary = salary;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
