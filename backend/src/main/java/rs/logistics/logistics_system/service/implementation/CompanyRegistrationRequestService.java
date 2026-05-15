package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.CompanyRegistrationReject;
import rs.logistics.logistics_system.dto.create.CompanyRegistrationRequestCreate;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationRequestResponse;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationValidationResponse;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationPublicStatusResponse;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationSourceType;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.CompanyRegistrationRequestMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.CityServiceDefinition;
import rs.logistics.logistics_system.service.definition.CompanyRegistrationRequestServiceDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimezoneServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.Set;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CompanyRegistrationRequestService implements CompanyRegistrationRequestServiceDefinition {

    private static final String ROLE_COMPANY_ADMIN = "COMPANY_ADMIN";
    private static final String ROLE_OVERLORD = "OVERLORD";
    private static final EmployeePosition BOOTSTRAP_ADMIN_POSITION = EmployeePosition.COMPANY_ADMIN;
    private static final BigDecimal BOOTSTRAP_ADMIN_SALARY = BigDecimal.ONE;
    private static final Set<CompanyRegistrationRequestStatus> ACTIVE_REQUEST_STATUSES = Set.of(
            CompanyRegistrationRequestStatus.SUBMITTED,
            CompanyRegistrationRequestStatus.UNDER_REVIEW
    );

    private final CompanyRegistrationRequestRepository requestRepository;
    private final CompanyRepository companyRepository;
    private final CountryRepository countryRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditFacadeDefinition auditFacade;
    private final NotificationServiceDefinition notificationService;
    private final CityServiceDefinition cityService;
    private final TimezoneServiceDefinition timezoneService;
    private final TimeServiceDefinition timeService;

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse submit(CompanyRegistrationRequestCreate dto) {
        Country country = countryRepository.findById(dto.getCountryId())
                .orElseThrow(() -> new ResourceNotFoundException("Country not found"));
        if (!Boolean.TRUE.equals(country.getActive())) {
            throw new BadRequestException("Country is not active");
        }

        dto.setCompanyEmail(generateCompanyContactEmail(dto.getCompanyName(), country.getIso2Code()));
        dto.setAdminEmail(generateEmployeeUserEmail(dto.getAdminFirstName(), dto.getAdminLastName(), dto.getCompanyName(), BOOTSTRAP_ADMIN_POSITION.name(), country.getIso2Code()));

        validateSubmitUniqueness(dto);

        City city = cityService.getRequiredActiveForCountry(dto.getCityId(), country.getId());
        dto.setPostalCode(city.getPostalCode());
        Timezone timezone = timezoneService.getRequiredForCountry(dto.getTimezoneId(), country.getId());

        CompanyRegistrationRequest request = CompanyRegistrationRequestMapper.toEntity(dto, country, city, timezone);
        request.setStatus(CompanyRegistrationRequestStatus.SUBMITTED);
        CompanyRegistrationRequest saved = requestRepository.save(request);
        notifyOverlordsAboutNewRegistrationRequest(saved);

        return CompanyRegistrationRequestMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyRegistrationRequestResponse> getAll(CompanyRegistrationRequestStatus status) {
        List<CompanyRegistrationRequest> requests = status == null
                ? requestRepository.findAllByOrderBySubmittedAtDesc()
                : requestRepository.findByStatusOrderBySubmittedAtDesc(status);
        return requests.stream().map(CompanyRegistrationRequestMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyRegistrationRequestResponse getById(Long id) {
        return CompanyRegistrationRequestMapper.toResponse(getRequired(id));
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyRegistrationPublicStatusResponse getPublicStatus(Long id) {
        CompanyRegistrationRequest request = getRequired(id);
        return new CompanyRegistrationPublicStatusResponse(
                request.getId(),
                request.getCompanyName(),
                request.getAdminEmail(),
                request.getStatus(),
                CompanyRegistrationRequestMapper.statusLabel(request.getStatus()),
                CompanyRegistrationRequestMapper.statusDescription(request.getStatus()),
                request.getStatus() == CompanyRegistrationRequestStatus.APPROVED
                        || request.getStatus() == CompanyRegistrationRequestStatus.REJECTED
                        || request.getStatus() == CompanyRegistrationRequestStatus.CANCELLED,
                request.getSubmittedAt(),
                request.getReviewedAt(),
                request.getStatus() == CompanyRegistrationRequestStatus.REJECTED ? request.getRejectionReason() : null,
                request.getCreatedCompany() != null ? request.getCreatedCompany().getId() : null
        );
    }


    @Override
    @Transactional(readOnly = true)
    public CompanyRegistrationValidationResponse validateAvailability(String companyName, String registrationNumber, String taxNumber, String adminEmail) {
        boolean companyNameAvailable = !hasText(companyName) || (!companyRepository.existsByNameIgnoreCase(companyName)
                && !requestRepository.existsByCompanyNameIgnoreCaseAndStatusIn(companyName, ACTIVE_REQUEST_STATUSES));
        boolean registrationNumberAvailable = !hasText(registrationNumber) || (!companyRepository.existsByRegistrationNumberIgnoreCase(registrationNumber)
                && !requestRepository.existsByRegistrationNumberIgnoreCaseAndStatusIn(registrationNumber, ACTIVE_REQUEST_STATUSES));
        boolean taxNumberAvailable = !hasText(taxNumber) || (!companyRepository.existsByTaxNumberIgnoreCase(taxNumber)
                && !requestRepository.existsByTaxNumberIgnoreCaseAndStatusIn(taxNumber, ACTIVE_REQUEST_STATUSES));
        boolean adminEmailAvailable = !hasText(adminEmail) || (!userRepository.existsByEmailIgnoreCase(adminEmail)
                && !employeeRepository.existsByEmailIgnoreCase(adminEmail)
                && !requestRepository.existsByAdminEmailIgnoreCaseAndStatusIn(adminEmail, ACTIVE_REQUEST_STATUSES));

        return new CompanyRegistrationValidationResponse(
                companyNameAvailable,
                registrationNumberAvailable,
                taxNumberAvailable,
                adminEmailAvailable,
                companyNameAvailable && registrationNumberAvailable && taxNumberAvailable && adminEmailAvailable
        );
    }

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse markUnderReview(Long id) {
        CompanyRegistrationRequest request = getRequired(id);
        ensureSubmitted(request);

        request.setStatus(CompanyRegistrationRequestStatus.UNDER_REVIEW);
        request.setReviewedBy(resolveCurrentUser());
        CompanyRegistrationRequest saved = requestRepository.save(request);

        auditFacade.recordStatusChange("COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "status", CompanyRegistrationRequestStatus.SUBMITTED, CompanyRegistrationRequestStatus.UNDER_REVIEW);
        auditFacade.log("UNDER_REVIEW", "COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "Company registration request moved to review");

        return CompanyRegistrationRequestMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse approve(Long id) {
        CompanyRegistrationRequest request = getRequired(id);
        ensureReviewable(request);
        CompanyRegistrationRequestStatus previousStatus = request.getStatus();
        validateApprovalUniqueness(request);

        Company company = new Company(request.getCompanyName());
        company.setActive(true);
        company.setCountry(request.getCountry());
        company.setCity(request.getCity());
        company.setPhoneCode(request.getCountry() != null ? request.getCountry().getPhoneCode() : null);
        company.setTimezone(request.getTimezone());
        company.setAddress(request.getAddress());
        company.setPostalCode(request.getPostalCode());
        company.setPhoneNumber(request.getCompanyPhoneNumber());
        company.setEmail(request.getCompanyEmail());
        company.setTaxNumber(request.getTaxNumber());
        company.setRegistrationNumber(request.getRegistrationNumber());
        Company savedCompany = companyRepository.save(company);

        Role companyAdminRole = roleRepository.findByName(ROLE_COMPANY_ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("COMPANY_ADMIN role not found"));

        User adminUser = new User(
                passwordEncoder.encode(request.getAdminPassword()),
                request.getAdminFirstName(),
                request.getAdminLastName(),
                request.getAdminEmail(),
                UserStatus.ACTIVE,
                companyAdminRole
        );
        adminUser.setEnabled(true);
        adminUser.setCompany(savedCompany);
        User savedAdminUser = userRepository.save(adminUser);

        Employee adminEmployee = new Employee(
                request.getAdminFirstName(),
                request.getAdminLastName(),
                request.getAdminJmbg(),
                request.getAdminPhoneNumber(),
                request.getAdminEmail(),
                BOOTSTRAP_ADMIN_POSITION,
                request.getAdminEmploymentDate(),
                BOOTSTRAP_ADMIN_SALARY,
                savedAdminUser
        );
        adminEmployee.setCompany(savedCompany);
        adminEmployee.setCountry(request.getCountry());
        adminEmployee.setAddress(request.getAdminAddress());
        adminEmployee.setPostalCode(request.getPostalCode());
        adminEmployee.setCity(request.getCity());
        adminEmployee.setTimezone(request.getTimezone());
        adminEmployee.setPhoneCode(request.getCountry() != null ? request.getCountry().getPhoneCode() : null);
        Employee savedAdminEmployee = employeeRepository.save(adminEmployee);

        request.setStatus(CompanyRegistrationRequestStatus.APPROVED);
        request.setReviewedAt(timeService.nowSystem());
        request.setReviewedBy(resolveCurrentUser());
        request.setCreatedCompany(savedCompany);
        CompanyRegistrationRequest savedRequest = requestRepository.save(request);

        auditFacade.recordCreate("COMPANY", savedCompany.getId(), savedCompany.getName());
        auditFacade.recordCreate("USER", savedAdminUser.getId(), savedAdminUser.getEmail());
        auditFacade.recordCreate("EMPLOYEE", savedAdminEmployee.getId(), savedAdminEmployee.getEmail());
        auditFacade.recordStatusChange("COMPANY_REGISTRATION_REQUEST", savedRequest.getId(), savedRequest.getCompanyName(),
                "status", previousStatus, CompanyRegistrationRequestStatus.APPROVED);
        auditFacade.log("APPROVE", "COMPANY_REGISTRATION_REQUEST", savedRequest.getId(), savedRequest.getCompanyName(),
                "Company registration request approved; companyId=" + savedCompany.getId()
                        + ", adminUserId=" + savedAdminUser.getId());

        return CompanyRegistrationRequestMapper.toResponse(savedRequest);
    }

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse reject(Long id, CompanyRegistrationReject dto) {
        CompanyRegistrationRequest request = getRequired(id);
        ensureReviewable(request);
        CompanyRegistrationRequestStatus previousStatus = request.getStatus();
        request.setStatus(CompanyRegistrationRequestStatus.REJECTED);
        request.setReviewedAt(timeService.nowSystem());
        request.setReviewedBy(resolveCurrentUser());
        request.setRejectionReason(dto.getRejectionReason());
        CompanyRegistrationRequest saved = requestRepository.save(request);

        auditFacade.recordStatusChange("COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "status", previousStatus, CompanyRegistrationRequestStatus.REJECTED);
        auditFacade.log("REJECT", "COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "Company registration request rejected");

        return CompanyRegistrationRequestMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse cancel(Long id) {
        CompanyRegistrationRequest request = getRequired(id);
        ensureReviewable(request);
        CompanyRegistrationRequestStatus previousStatus = request.getStatus();
        request.setStatus(CompanyRegistrationRequestStatus.CANCELLED);
        request.setReviewedAt(timeService.nowSystem());
        CompanyRegistrationRequest saved = requestRepository.save(request);
        auditFacade.recordStatusChange("COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "status", previousStatus, CompanyRegistrationRequestStatus.CANCELLED);
        return CompanyRegistrationRequestMapper.toResponse(saved);
    }

    private CompanyRegistrationRequest getRequired(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company registration request not found"));
    }

    private void ensureSubmitted(CompanyRegistrationRequest request) {
        if (request.getStatus() != CompanyRegistrationRequestStatus.SUBMITTED) {
            throw new BadRequestException("Only submitted registration requests can be moved to review");
        }
    }

    private void ensureReviewable(CompanyRegistrationRequest request) {
        if (request.getStatus() != CompanyRegistrationRequestStatus.SUBMITTED
                && request.getStatus() != CompanyRegistrationRequestStatus.UNDER_REVIEW) {
            throw new BadRequestException("Only submitted or under-review registration requests can be completed");
        }
    }

    private void notifyOverlordsAboutNewRegistrationRequest(CompanyRegistrationRequest request) {
        List<User> overlords = userRepository.findByRole_NameIgnoreCaseAndEnabledTrueAndStatus(ROLE_OVERLORD, UserStatus.ACTIVE);
        for (User overlord : overlords) {
            notificationService.createOperationalNotification(
                    overlord.getId(),
                    "New company registration request",
                    request.getCompanyName() + " submitted a company registration request and is waiting for review.",
                    NotificationType.INFO,
                    NotificationSeverity.INFO,
                    NotificationCategory.SECURITY,
                    NotificationSourceType.SYSTEM,
                    request.getId(),
                    "company-registration-request-created-" + request.getId() + "-user-" + overlord.getId()
            );
        }
    }

    private void validateSubmitUniqueness(CompanyRegistrationRequestCreate dto) {
        if (companyRepository.existsByNameIgnoreCase(dto.getCompanyName())
                || requestRepository.existsByCompanyNameIgnoreCaseAndStatusIn(dto.getCompanyName(), ACTIVE_REQUEST_STATUSES)) {
            throw new ConflictException("Company with this name already exists or has a pending request");
        }
        if (hasText(dto.getRegistrationNumber()) && companyRepository.existsByRegistrationNumberIgnoreCase(dto.getRegistrationNumber())) {
            throw new ConflictException("Company with this registration number already exists");
        }
        if (hasText(dto.getRegistrationNumber()) && requestRepository.existsByRegistrationNumberIgnoreCaseAndStatusIn(dto.getRegistrationNumber(), ACTIVE_REQUEST_STATUSES)) {
            throw new ConflictException("Registration number already has a pending request");
        }
        if (hasText(dto.getTaxNumber()) && companyRepository.existsByTaxNumberIgnoreCase(dto.getTaxNumber())) {
            throw new ConflictException("Company with this tax number already exists");
        }
        if (hasText(dto.getTaxNumber()) && requestRepository.existsByTaxNumberIgnoreCaseAndStatusIn(dto.getTaxNumber(), ACTIVE_REQUEST_STATUSES)) {
            throw new ConflictException("Tax number already has a pending request");
        }
        if (userRepository.existsByEmailIgnoreCase(dto.getAdminEmail()) || employeeRepository.existsByEmailIgnoreCase(dto.getAdminEmail())) {
            throw new ConflictException("Admin email already exists");
        }
        if (requestRepository.existsByAdminEmailIgnoreCaseAndStatusIn(dto.getAdminEmail(), ACTIVE_REQUEST_STATUSES)) {
            throw new ConflictException("Admin email already has a pending request");
        }
    }

    private void validateApprovalUniqueness(CompanyRegistrationRequest request) {
        if (companyRepository.existsByNameIgnoreCase(request.getCompanyName())) {
            throw new ConflictException("Company with this name already exists");
        }
        if (hasText(request.getRegistrationNumber()) && companyRepository.existsByRegistrationNumberIgnoreCase(request.getRegistrationNumber())) {
            throw new ConflictException("Company with this registration number already exists");
        }
        if (hasText(request.getTaxNumber()) && companyRepository.existsByTaxNumberIgnoreCase(request.getTaxNumber())) {
            throw new ConflictException("Company with this tax number already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(request.getAdminEmail()) || employeeRepository.existsByEmailIgnoreCase(request.getAdminEmail())) {
            throw new ConflictException("Admin email already exists");
        }
    }

    private String generateCompanyContactEmail(String companyName, String countryCode) {
        String companySlug = normalizeForEmailPart(companyName, true);
        String countrySlug = normalizeForEmailPart(countryCode, true);
        if (companySlug.isBlank() || countrySlug.isBlank()) {
            throw new BadRequestException("Unable to generate company contact email");
        }
        return "contact@" + companySlug + "." + countrySlug;
    }

    private String generateEmployeeUserEmail(String firstName, String lastName, String companyName, String roleName, String countryCode) {
        String firstSlug = normalizeForEmailPart(firstName, false);
        String lastSlug = normalizeForEmailPart(lastName, false);
        String companySlug = normalizeForEmailPart(companyName, true);
        String roleSlug = normalizeForEmailPart(roleName, true);
        String countrySlug = normalizeForEmailPart(countryCode, true);

        if (firstSlug.isBlank() || lastSlug.isBlank() || companySlug.isBlank() || roleSlug.isBlank() || countrySlug.isBlank()) {
            throw new BadRequestException("Unable to generate administrator email");
        }

        String baseLocalPart = firstSlug + "." + lastSlug;
        String domain = companySlug + "." + roleSlug + "." + countrySlug;
        String candidate = baseLocalPart + "@" + domain;
        int suffix = 1;

        while (userRepository.existsByEmailIgnoreCase(candidate) || employeeRepository.existsByEmailIgnoreCase(candidate)) {
            candidate = baseLocalPart + suffix + "@" + domain;
            suffix++;
        }

        return candidate;
    }

    private String normalizeForEmailPart(String value, boolean allowHyphen) {
        String normalized = Normalizer.normalize(value == null ? "" : value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        normalized = normalized.replace("đ", "dj");
        normalized = allowHyphen
                ? normalized.replaceAll("[^a-z0-9]+", "-")
                : normalized.replaceAll("[^a-z0-9]+", "");
        normalized = normalized.replaceAll("^-+|-+$", "");
        return normalized.length() > 40 ? normalized.substring(0, 40).replaceAll("-+$", "") : normalized;
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
