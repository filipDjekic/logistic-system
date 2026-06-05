package rs.logistics.logistics_system.service.support;

import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.UserRepository;

import java.text.Normalizer;
import java.util.Locale;

@Component
public class EmployeeEmailGenerator {

    public static final String SOURCE_EMPLOYEE_CREATE_WITH_USER = "EMPLOYEE_CREATE_WITH_USER";
    public static final String SOURCE_COMPANY_APPROVAL_ADMIN = "COMPANY_APPROVAL_ADMIN";
    public static final String SOURCE_EMPLOYEE_UPDATE_SUGGESTION = "EMPLOYEE_UPDATE_SUGGESTION";

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public EmployeeEmailGenerator(UserRepository userRepository, EmployeeRepository employeeRepository) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    public String generateUnique(String firstName, String lastName, Company company, EmployeePosition position, Country country) {
        return generateUniqueExcluding(firstName, lastName, company, position, country, null, null);
    }

    public String generateUniqueExcluding(String firstName,
                                          String lastName,
                                          Company company,
                                          EmployeePosition position,
                                          Country country,
                                          Long excludedUserId,
                                          Long excludedEmployeeId) {
        String baseLocalPart = buildLocalPart(firstName, lastName);
        String domain = buildDomain(company, position, country);
        String candidate = baseLocalPart + "@" + domain;
        int suffix = 2;

        while (emailExists(candidate, excludedUserId, excludedEmployeeId)) {
            candidate = baseLocalPart + suffix + "@" + domain;
            suffix++;
        }

        return candidate;
    }

    public String buildSuggestion(String firstName, String lastName, Company company, EmployeePosition position, Country country) {
        return buildLocalPart(firstName, lastName) + "@" + buildDomain(company, position, country);
    }

    private boolean emailExists(String email, Long excludedUserId, Long excludedEmployeeId) {
        boolean userExists = excludedUserId == null
                ? userRepository.existsByEmailIgnoreCase(email)
                : userRepository.existsByEmailIgnoreCaseAndIdNot(email, excludedUserId);
        boolean employeeExists = excludedEmployeeId == null
                ? employeeRepository.existsByEmailIgnoreCase(email)
                : employeeRepository.existsByEmailIgnoreCaseAndIdNot(email, excludedEmployeeId);
        return userExists || employeeExists;
    }

    private String buildLocalPart(String firstName, String lastName) {
        String firstSlug = normalizeForEmailPart(firstName, false);
        String lastSlug = normalizeForEmailPart(lastName, false);
        String localPart = (firstSlug + "." + lastSlug)
                .replaceAll("\\.+", ".")
                .replaceAll("^\\.|\\.$", "");
        if (localPart.isBlank()) {
            throw new BadRequestException("Unable to generate employee email local part");
        }
        return localPart.length() > 40 ? localPart.substring(0, 40).replaceAll("\\.$", "") : localPart;
    }

    private String buildDomain(Company company, EmployeePosition position, Country country) {
        String companySlug = normalizeForEmailPart(company != null ? company.getName() : null, true);
        String positionSlug = normalizeForEmailPart(position != null ? position.name() : null, true);
        String countrySlug = normalizeForEmailPart(country != null ? country.getIso2Code() : null, true);

        if (companySlug.isBlank() || positionSlug.isBlank() || countrySlug.isBlank()) {
            throw new BadRequestException("Unable to generate employee email domain");
        }

        return companySlug + "." + positionSlug + "." + countrySlug;
    }

    private String normalizeForEmailPart(String value, boolean allowHyphen) {
        String normalized = Normalizer.normalize(value == null ? "" : value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "dj")
                .replace("Đ", "dj")
                .toLowerCase(Locale.ROOT);
        normalized = allowHyphen
                ? normalized.replaceAll("[^a-z0-9]+", "-")
                : normalized.replaceAll("[^a-z0-9]+", ".");
        normalized = normalized
                .replaceAll("[-.]{2,}", allowHyphen ? "-" : ".")
                .replaceAll("^[-.]+|[-.]+$", "");
        return normalized.length() > 40 ? normalized.substring(0, 40).replaceAll("[-.]+$", "") : normalized;
    }
}
