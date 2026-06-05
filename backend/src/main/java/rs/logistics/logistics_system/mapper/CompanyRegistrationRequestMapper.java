package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.CompanyRegistrationRequestCreate;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationRequestResponse;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

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
        request.setPostalCode(city.getPostalCode());
        request.setTimezone(timezone);
        request.setAddress(dto.getAddress());
        request.setAdminFirstName(dto.getAdminFirstName());
        request.setAdminLastName(dto.getAdminLastName());
        request.setAdminAddress(dto.getAdminAddress());
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
        response.setAdminAddress(request.getAdminAddress());
        response.setAdminEmail(request.getAdminEmail());
        response.setAdminPhoneNumber(request.getAdminPhoneNumber());
        response.setAdminJmbg(request.getAdminJmbg());
        response.setAdminEmploymentDate(request.getAdminEmploymentDate());
        CompanyRegistrationRequestStatus status = request.getStatus();
        response.setStatus(status);
        response.setStatusLabel(statusLabel(status));
        response.setStatusDescription(statusDescription(status));
        response.setReviewable(status == CompanyRegistrationRequestStatus.PENDING || status == CompanyRegistrationRequestStatus.UNDER_REVIEW);
        response.setTerminal(status == CompanyRegistrationRequestStatus.APPROVED
                || status == CompanyRegistrationRequestStatus.REJECTED
                || status == CompanyRegistrationRequestStatus.CANCELLED);
        response.setCanMoveToReview(status == CompanyRegistrationRequestStatus.PENDING);
        response.setCanApprove(status == CompanyRegistrationRequestStatus.PENDING || status == CompanyRegistrationRequestStatus.UNDER_REVIEW);
        response.setCanReject(status == CompanyRegistrationRequestStatus.PENDING || status == CompanyRegistrationRequestStatus.UNDER_REVIEW);
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

    public static String statusLabel(CompanyRegistrationRequestStatus status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case PENDING -> "Pending";
            case UNDER_REVIEW -> "Under review";
            case APPROVED -> "Approved";
            case REJECTED -> "Rejected";
            case CANCELLED -> "Cancelled";
        };
    }

    public static String statusDescription(CompanyRegistrationRequestStatus status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case PENDING -> "Request has been submitted and is waiting for review.";
            case UNDER_REVIEW -> "Request is currently being reviewed by an overlord.";
            case APPROVED -> "Request has been approved and the company account has been created.";
            case REJECTED -> "Request has been rejected.";
            case CANCELLED -> "Request has been cancelled.";
        };
    }
}
