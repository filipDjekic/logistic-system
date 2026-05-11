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
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.CompanyRegistrationRequestMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.CityServiceDefinition;
import rs.logistics.logistics_system.service.definition.CompanyRegistrationRequestServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimezoneServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyRegistrationRequestService implements CompanyRegistrationRequestServiceDefinition {

    private static final String ROLE_COMPANY_ADMIN = "COMPANY_ADMIN";
    private static final BigDecimal BOOTSTRAP_ADMIN_SALARY = BigDecimal.ONE;

    private final CompanyRegistrationRequestRepository requestRepository;
    private final CompanyRepository companyRepository;
    private final CountryRepository countryRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditFacadeDefinition auditFacade;
    private final CityServiceDefinition cityService;
    private final TimezoneServiceDefinition timezoneService;
    private final TimeServiceDefinition timeService;

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse submit(CompanyRegistrationRequestCreate dto) {
        validateSubmitUniqueness(dto);

        Country country = countryRepository.findById(dto.getCountryId())
                .orElseThrow(() -> new ResourceNotFoundException("Country not found"));
        if (!Boolean.TRUE.equals(country.getActive())) {
            throw new BadRequestException("Country is not active");
        }

        City city = cityService.getRequiredActiveForCountry(dto.getCityId(), country.getId());
        Timezone timezone = timezoneService.getRequiredForCountry(dto.getTimezoneId(), country.getId());

        CompanyRegistrationRequest request = CompanyRegistrationRequestMapper.toEntity(dto, country, city, timezone);
        request.setStatus(CompanyRegistrationRequestStatus.SUBMITTED);
        CompanyRegistrationRequest saved = requestRepository.save(request);

        auditFacade.recordCreate("COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName());
        auditFacade.log("SUBMIT", "COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "Company registration request submitted for " + saved.getCompanyName());

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
    @Transactional
    public CompanyRegistrationRequestResponse approve(Long id) {
        CompanyRegistrationRequest request = getRequired(id);
        ensureSubmitted(request);
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
                EmployeePosition.COMPANY_ADMIN,
                request.getAdminEmploymentDate(),
                BOOTSTRAP_ADMIN_SALARY,
                savedAdminUser
        );
        adminEmployee.setCompany(savedCompany);
        adminEmployee.setCountry(request.getCountry());
        adminEmployee.setCity(request.getCity());
        adminEmployee.setTimezone(request.getTimezone());
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
                "status", CompanyRegistrationRequestStatus.SUBMITTED, CompanyRegistrationRequestStatus.APPROVED);
        auditFacade.log("APPROVE", "COMPANY_REGISTRATION_REQUEST", savedRequest.getId(), savedRequest.getCompanyName(),
                "Company registration request approved; companyId=" + savedCompany.getId()
                        + ", adminUserId=" + savedAdminUser.getId());

        return CompanyRegistrationRequestMapper.toResponse(savedRequest);
    }

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse reject(Long id, CompanyRegistrationReject dto) {
        CompanyRegistrationRequest request = getRequired(id);
        ensureSubmitted(request);
        request.setStatus(CompanyRegistrationRequestStatus.REJECTED);
        request.setReviewedAt(timeService.nowSystem());
        request.setReviewedBy(resolveCurrentUser());
        request.setRejectionReason(dto.getRejectionReason());
        CompanyRegistrationRequest saved = requestRepository.save(request);

        auditFacade.recordStatusChange("COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "status", CompanyRegistrationRequestStatus.SUBMITTED, CompanyRegistrationRequestStatus.REJECTED);
        auditFacade.log("REJECT", "COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "Company registration request rejected");

        return CompanyRegistrationRequestMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CompanyRegistrationRequestResponse cancel(Long id) {
        CompanyRegistrationRequest request = getRequired(id);
        ensureSubmitted(request);
        request.setStatus(CompanyRegistrationRequestStatus.CANCELLED);
        request.setReviewedAt(timeService.nowSystem());
        CompanyRegistrationRequest saved = requestRepository.save(request);
        auditFacade.recordStatusChange("COMPANY_REGISTRATION_REQUEST", saved.getId(), saved.getCompanyName(),
                "status", CompanyRegistrationRequestStatus.SUBMITTED, CompanyRegistrationRequestStatus.CANCELLED);
        return CompanyRegistrationRequestMapper.toResponse(saved);
    }

    private CompanyRegistrationRequest getRequired(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company registration request not found"));
    }

    private void ensureSubmitted(CompanyRegistrationRequest request) {
        if (request.getStatus() != CompanyRegistrationRequestStatus.SUBMITTED) {
            throw new BadRequestException("Only submitted registration requests can be reviewed");
        }
    }

    private void validateSubmitUniqueness(CompanyRegistrationRequestCreate dto) {
        if (companyRepository.existsByNameIgnoreCase(dto.getCompanyName())
                || requestRepository.existsByCompanyNameIgnoreCaseAndStatus(dto.getCompanyName(), CompanyRegistrationRequestStatus.SUBMITTED)) {
            throw new ConflictException("Company with this name already exists or has a pending request");
        }
        if (hasText(dto.getRegistrationNumber()) && companyRepository.existsByRegistrationNumberIgnoreCase(dto.getRegistrationNumber())) {
            throw new ConflictException("Company with this registration number already exists");
        }
        if (hasText(dto.getRegistrationNumber()) && requestRepository.existsByRegistrationNumberIgnoreCaseAndStatus(dto.getRegistrationNumber(), CompanyRegistrationRequestStatus.SUBMITTED)) {
            throw new ConflictException("Registration number already has a pending request");
        }
        if (hasText(dto.getTaxNumber()) && companyRepository.existsByTaxNumberIgnoreCase(dto.getTaxNumber())) {
            throw new ConflictException("Company with this tax number already exists");
        }
        if (hasText(dto.getTaxNumber()) && requestRepository.existsByTaxNumberIgnoreCaseAndStatus(dto.getTaxNumber(), CompanyRegistrationRequestStatus.SUBMITTED)) {
            throw new ConflictException("Tax number already has a pending request");
        }
        if (userRepository.existsByEmailIgnoreCase(dto.getAdminEmail()) || employeeRepository.existsByEmailIgnoreCase(dto.getAdminEmail())) {
            throw new ConflictException("Admin email already exists");
        }
        if (requestRepository.existsByAdminEmailIgnoreCaseAndStatus(dto.getAdminEmail(), CompanyRegistrationRequestStatus.SUBMITTED)) {
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
