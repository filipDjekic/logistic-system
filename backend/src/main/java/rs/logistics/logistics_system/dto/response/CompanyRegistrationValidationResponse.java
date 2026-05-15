package rs.logistics.logistics_system.dto.response;

public record CompanyRegistrationValidationResponse(
        boolean companyNameAvailable,
        boolean registrationNumberAvailable,
        boolean taxNumberAvailable,
        boolean adminEmailAvailable,
        boolean valid
) {
}
