package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;

public class EmployeeMapper {

    public static Employee toEntity(EmployeeCreate dto, User user, Timezone timezone) {
        Employee employee = new Employee(dto.getFirstName(), dto.getLastName(), dto.getJmbg(), dto.getPhoneNumber(), dto.getEmail(), dto.getPosition(), dto.getEmploymentDate(), dto.getSalary(), user);
        employee.setAddress(dto.getAddress());
        employee.setPostalCode(dto.getPostalCode());
        employee.setTimezone(timezone);
        return employee;
    }

    public static void updateEntity(EmployeeUpdate dto, Employee entity, User user, Timezone timezone) {
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setJmbg(dto.getJmbg());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setEmail(dto.getEmail());
        entity.setAddress(dto.getAddress());
        entity.setPostalCode(dto.getPostalCode());
        entity.setTimezone(timezone);
        entity.setPosition(dto.getPosition());
        entity.setEmploymentDate(dto.getEmploymentDate());
        entity.setSalary(dto.getSalary());
        entity.setUser(user);
    }

    public static EmployeeResponse toResponse(Employee employee) {
        Country country = employee.getCountry();
        City city = employee.getCity();
        Timezone timezone = employee.getTimezone();
        Warehouse primaryWarehouse = employee.getPrimaryWarehouse();
        EmployeeResponse response = new EmployeeResponse();
        response.setId(employee.getId());
        response.setFirstName(employee.getFirstName());
        response.setLastName(employee.getLastName());
        response.setJmbg(employee.getJmbg());
        response.setPhoneCode(country != null ? country.getPhoneCode() : null);
        response.setPhoneNumber(employee.getPhoneNumber());
        response.setEmail(employee.getEmail());
        response.setAddress(employee.getAddress());
        response.setCityId(city != null ? city.getId() : null);
        response.setCityName(city != null ? city.getName() : null);
        response.setCity(city != null ? city.getName() : null);
        response.setPostalCode(employee.getPostalCode());
        response.setTimezoneId(timezone != null ? timezone.getId() : null);
        response.setTimezoneName(timezone != null ? timezone.getName() : null);
        response.setTimezoneDisplayName(timezone != null ? timezone.getDisplayName() : null);
        response.setTimezone(timezone != null ? timezone.getName() : null);
        response.setCountryId(country != null ? country.getId() : null);
        response.setCountryCode(country != null ? country.getIso2Code() : null);
        response.setCountryName(country != null ? country.getName() : null);
        response.setPrimaryWarehouseId(primaryWarehouse != null ? primaryWarehouse.getId() : null);
        response.setPrimaryWarehouseName(primaryWarehouse != null ? primaryWarehouse.getName() : null);
        response.setPosition(employee.getPosition());
        response.setEmploymentDate(employee.getEmploymentDate());
        response.setSalary(employee.getSalary());
        response.setActive(employee.getActive());
        response.setUserId(employee.getUser() != null ? employee.getUser().getId() : null);
        response.setCompanyId(employee.getCompany() != null ? employee.getCompany().getId() : null);
        response.setCompanyName(employee.getCompany() != null ? employee.getCompany().getName() : null);
        return response;
    }
}
