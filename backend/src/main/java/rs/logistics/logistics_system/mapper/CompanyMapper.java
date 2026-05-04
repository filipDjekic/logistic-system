package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.CompanyCreate;
import rs.logistics.logistics_system.dto.response.CompanyResponse;
import rs.logistics.logistics_system.dto.update.CompanyUpdate;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.User;

public class CompanyMapper {

    public static Company toEntity(CompanyCreate dto, Country country, City city, Timezone timezone) {
        Company company = new Company(dto.getName());
        company.setCountry(country);
        company.setCity(city);
        company.setPhoneCode(country != null ? country.getPhoneCode() : null);
        company.setTimezone(timezone);
        company.setAddress(dto.getAddress());
        company.setPostalCode(dto.getPostalCode());
        company.setPhoneNumber(dto.getPhoneNumber());
        company.setEmail(dto.getEmail());
        company.setTaxNumber(dto.getTaxNumber());
        company.setRegistrationNumber(dto.getRegistrationNumber());
        return company;
    }

    public static void updateEntity(Company company, CompanyUpdate dto, Country country, City city, Timezone timezone) {
        company.setName(dto.getName());
        company.setActive(dto.getActive());
        company.setCountry(country);
        company.setCity(city);
        company.setPhoneCode(country != null ? country.getPhoneCode() : null);
        company.setTimezone(timezone);
        company.setAddress(dto.getAddress());
        company.setPostalCode(dto.getPostalCode());
        company.setPhoneNumber(dto.getPhoneNumber());
        company.setEmail(dto.getEmail());
        company.setTaxNumber(dto.getTaxNumber());
        company.setRegistrationNumber(dto.getRegistrationNumber());
    }

    public static CompanyResponse toResponse(Company company) {
        User adminUser = company.getUsers()
                .stream()
                .filter(user -> user.getRole() != null && "COMPANY_ADMIN".equalsIgnoreCase(user.getRole().getName()))
                .findFirst()
                .orElse(null);
        Employee adminEmployee = adminUser != null ? adminUser.getEmployee() : null;
        String adminFullName = adminUser == null ? null : (adminUser.getFirstName() + " " + adminUser.getLastName()).trim();
        Country country = company.getCountry();
        City city = company.getCity();
        Timezone timezone = company.getTimezone();

        String currencyCode = country != null ? country.getCurrencyCode() : null;
        String currencyName = country != null ? country.getCurrencyName() : null;
        String phoneCode = country != null ? country.getPhoneCode() : company.getPhoneCode();
        String timezoneName = timezone != null ? timezone.getName() : null;

        CompanyResponse response = new CompanyResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        response.setActive(company.getActive());
        response.setCountryId(country != null ? country.getId() : null);
        response.setCountryCode(country != null ? country.getIso2Code() : null);
        response.setCountryName(country != null ? country.getName() : null);
        response.setCurrencyCode(currencyCode);
        response.setCurrencyName(currencyName);
        response.setPhoneCode(phoneCode);
        response.setTimezoneId(timezone != null ? timezone.getId() : null);
        response.setTimezoneName(timezoneName);
        response.setTimezoneDisplayName(timezone != null ? timezone.getDisplayName() : null);
        response.setEffectiveCurrencyCode(currencyCode);
        response.setEffectivePhoneCode(phoneCode);
        response.setEffectiveTimezone(timezoneName);
        response.setTimezone(timezoneName);
        response.setAddress(company.getAddress());
        response.setCityId(city != null ? city.getId() : null);
        response.setCityName(city != null ? city.getName() : null);
        response.setCity(city != null ? city.getName() : null);
        response.setPostalCode(company.getPostalCode());
        response.setPhoneNumber(company.getPhoneNumber());
        response.setEmail(company.getEmail());
        response.setTaxNumber(company.getTaxNumber());
        response.setRegistrationNumber(company.getRegistrationNumber());
        response.setCreatedAt(company.getCreatedAt());
        response.setUpdatedAt(company.getUpdatedAt());
        response.setAdminUserId(adminUser != null ? adminUser.getId() : null);
        response.setAdminEmployeeId(adminEmployee != null ? adminEmployee.getId() : null);
        response.setAdminFullName(adminFullName);
        response.setAdminEmail(adminUser != null ? adminUser.getEmail() : null);
        return response;
    }
}
