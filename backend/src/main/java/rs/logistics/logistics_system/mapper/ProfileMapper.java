package rs.logistics.logistics_system.mapper;

import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.dto.response.ProfileResponse;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;

@Component
public class ProfileMapper {

    public ProfileResponse toResponse(User user) {
        ProfileResponse response = new ProfileResponse();
        response.setUserId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setEnabled(user.getEnabled());
        response.setUserStatus(user.getStatus());
        response.setRole(user.getRole() != null ? user.getRole().getName() : null);

        Company company = user.getCompany();
        if (company != null) {
            response.setCompanyId(company.getId());
            response.setCompanyName(company.getName());
            response.setCompanyActive(company.getActive());
        }

        Employee employee = user.getEmployee();
        if (employee != null) {
            mapEmployee(response, employee);
        }

        return response;
    }

    private void mapEmployee(ProfileResponse response, Employee employee) {
        response.setEmployeeId(employee.getId());
        response.setEmployeeFirstName(employee.getFirstName());
        response.setEmployeeLastName(employee.getLastName());
        response.setMaskedJmbg(maskJmbg(employee.getJmbg()));
        response.setPhoneCode(employee.getPhoneCode());
        response.setPhoneNumber(employee.getPhoneNumber());
        response.setEmployeeEmail(employee.getEmail());
        response.setAddress(employee.getAddress());
        response.setPostalCode(employee.getPostalCode());
        response.setPosition(employee.getPosition());
        response.setEmploymentDate(employee.getEmploymentDate());
        response.setActive(employee.getActive());

        City city = employee.getCity();
        if (city != null) {
            response.setCityId(city.getId());
            response.setCityName(city.getName());
        }

        Country country = employee.getCountry();
        if (country != null) {
            response.setCountryId(country.getId());
            response.setCountryCode(country.getCode());
            response.setCountryName(country.getName());
        }

        Timezone timezone = employee.getTimezone();
        if (timezone != null) {
            response.setTimezoneId(timezone.getId());
            response.setTimezoneName(timezone.getName());
            response.setTimezoneDisplayName(timezone.getDisplayName());
        }

        Warehouse primaryWarehouse = employee.getPrimaryWarehouse();
        if (primaryWarehouse != null) {
            response.setPrimaryWarehouseId(primaryWarehouse.getId());
            response.setPrimaryWarehouseName(primaryWarehouse.getName());
            if (primaryWarehouse.getCompany() != null) {
                response.setPrimaryWarehouseCompanyId(primaryWarehouse.getCompany().getId());
                response.setPrimaryWarehouseCompanyName(primaryWarehouse.getCompany().getName());
            }
        }
    }

    private String maskJmbg(String jmbg) {
        if (jmbg == null || jmbg.isBlank()) {
            return null;
        }
        String normalized = jmbg.trim();
        if (normalized.length() <= 4) {
            return "*".repeat(normalized.length());
        }
        return "*".repeat(normalized.length() - 4) + normalized.substring(normalized.length() - 4);
    }
}
