package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.CompanyRegistrationRequestCreate;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationRequestResponse;
import rs.logistics.logistics_system.entity.*;

public class CompanyRegistrationRequestMapper {

    public static CompanyRegistrationRequest toEntity(CompanyRegistrationRequestCreate dto, Country country, City city, Timezone timezone) {
        CompanyRegistrationRequest request = new CompanyRegistrationRequest();
        request.setCompanyName(dto.getCompanyName());
        request.setRegistrationNumber(dto.getRegistrationNumber());
        request.setTaxNumber(dto.getTaxNumber());
        request.setCompanyEmail(dto.getCompanyEmail());
        request.setCompanyPhoneNumber(dto.getCompanyPhoneNumber());
        request.setCountry(country);
        request.setCity(city);
        request.setTimezone(timezone);
        request.setAddress(dto.getAddress());
        request.setPostalCode(dto.getPostalCode());
        request.setAdminFirstName(dto.getAdminFirstName());
        request.setAdminLastName(dto.getAdminLastName());
        request.setAdminEmail(dto.getAdminEmail());
        request.setAdminPhoneNumber(dto.getAdminPhoneNumber());
        request.setAdminJmbg(dto.getAdminJmbg());
        request.setAdminPassword(dto.getAdminPassword());
        request.setAdminEmploymentDate(dto.getAdminEmploymentDate());
        request.setNotes(dto.getNotes());
        return request;
    }

    public static CompanyRegistrationRequestResponse toResponse(CompanyRegistrationRequest request) {
        Country country = request.getCountry();
        City city = request.getCity();
        Timezone timezone = request.getTimezone();
        User reviewer = request.getReviewedBy();
        Company company = request.getCreatedCompany();

        CompanyRegistrationRequestResponse response = new CompanyRegistrationRequestResponse();
        response.setId(request.getId());
        response.setCompanyName(request.getCompanyName());
        response.setRegistrationNumber(request.getRegistrationNumber());
        response.setTaxNumber(request.getTaxNumber());
        response.setCompanyEmail(request.getCompanyEmail());
        response.setCompanyPhoneNumber(request.getCompanyPhoneNumber());
        response.setCountryId(country != null ? country.getId() : null);
        response.setCountryName(country != null ? country.getName() : null);
        response.setCountryCode(country != null ? country.getIso2Code() : null);
        response.setCityId(city != null ? city.getId() : null);
        response.setCityName(city != null ? city.getName() : null);
        response.setTimezoneId(timezone != null ? timezone.getId() : null);
        response.setTimezoneName(timezone != null ? timezone.getName() : null);
        response.setTimezoneDisplayName(timezone != null ? timezone.getDisplayName() : null);
        response.setAddress(request.getAddress());
        response.setPostalCode(request.getPostalCode());
        response.setAdminFirstName(request.getAdminFirstName());
        response.setAdminLastName(request.getAdminLastName());
        response.setAdminEmail(request.getAdminEmail());
        response.setAdminPhoneNumber(request.getAdminPhoneNumber());
        response.setAdminJmbg(request.getAdminJmbg());
        response.setAdminEmploymentDate(request.getAdminEmploymentDate());
        response.setStatus(request.getStatus());
        response.setSubmittedAt(request.getSubmittedAt());
        response.setReviewedAt(request.getReviewedAt());
        response.setReviewedById(reviewer != null ? reviewer.getId() : null);
        response.setReviewedByEmail(reviewer != null ? reviewer.getEmail() : null);
        response.setRejectionReason(request.getRejectionReason());
        response.setNotes(request.getNotes());
        response.setCreatedCompanyId(company != null ? company.getId() : null);
        response.setUpdatedAt(request.getUpdatedAt());
        return response;
    }
}
