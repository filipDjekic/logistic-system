package rs.logistics.logistics_system.service.implementation;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.EmployeeProfileChangeRequestCreate;
import rs.logistics.logistics_system.dto.response.EmployeeProfileChangeRequestResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.update.EmployeeProfileChangeRequestReview;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.EmployeeProfileChangeRequest;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.EmployeeProfileChangeRequestStatus;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationSourceType;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.EmployeeProfileChangeRequestMapper;
import rs.logistics.logistics_system.repository.CityRepository;
import rs.logistics.logistics_system.repository.CountryRepository;
import rs.logistics.logistics_system.repository.EmployeeProfileChangeRequestRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TimezoneRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.EmployeeProfileChangeRequestServiceDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.support.EmployeeProfileChangeRequestRateLimiter;

@Service
@RequiredArgsConstructor
public class EmployeeProfileChangeRequestService implements EmployeeProfileChangeRequestServiceDefinition {

    private static final Set<String> ALLOWED_FIELDS = Set.of(
            "phoneCode",
            "phoneNumber",
            "email",
            "address",
            "cityId",
            "postalCode",
            "countryId",
            "timezoneId"
    );

    private static final Set<String> STRING_FIELDS = Set.of(
            "phoneCode",
            "phoneNumber",
            "email",
            "address",
            "postalCode"
    );

    private static final Set<String> ID_FIELDS = Set.of(
            "cityId",
            "countryId",
            "timezoneId"
    );

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final EmployeeProfileChangeRequestRepository repository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final CountryRepository countryRepository;
    private final TimezoneRepository timezoneRepository;
    private final EmployeeProfileChangeRequestMapper mapper;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AuditFacadeDefinition auditFacade;
    private final NotificationServiceDefinition notificationService;
    private final DomainEventServiceDefinition domainEventService;
    private final EmployeeProfileChangeRequestRateLimiter rateLimiter;

    @Override
    @Transactional
    public EmployeeProfileChangeRequestResponse createCurrentUserRequest(EmployeeProfileChangeRequestCreate dto) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Employee employee = requireLinkedEmployee(user);
        rateLimiter.checkCreateAllowed(user.getId());

        if (repository.existsByEmployee_IdAndStatus(employee.getId(), EmployeeProfileChangeRequestStatus.PENDING)) {
            throw new ConflictException("Employee already has a pending profile change request");
        }

        Map<String, Object> normalizedChanges = normalizeAndValidateRequestedChanges(dto.getRequestedChanges());

        EmployeeProfileChangeRequest request = new EmployeeProfileChangeRequest();
        request.setEmployee(employee);
        request.setRequestedBy(user);
        request.setCompany(employee.getCompany());
        request.setStatus(EmployeeProfileChangeRequestStatus.PENDING);
        request.setRequestedChangesJson(mapper.toJson(normalizedChanges));
        request.setReason(normalizeOptionalString(dto.getReason(), 1000, "reason"));

        EmployeeProfileChangeRequest saved = repository.save(request);
        auditFacade.recordCreate("EmployeeProfileChangeRequest", saved.getId(), requestIdentifier(saved));
        auditFacade.log(
                "CREATE_PROFILE_CHANGE_REQUEST",
                "EmployeeProfileChangeRequest",
                saved.getId(),
                requestIdentifier(saved),
                "Submitted employee profile change request"
        );
        recordProfileDomainEvent(saved, DomainEventType.SYSTEM_EVENT, "Employee profile change request submitted");

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmployeeProfileChangeRequestResponse> getCurrentUserRequests(Pageable pageable) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Employee employee = requireLinkedEmployee(user);

        Page<EmployeeProfileChangeRequest> page = repository.findAllByEmployee_Id(employee.getId(), pageable);
        return PageResponse.fromContent(page.map(mapper::toResponse).getContent(), page);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeProfileChangeRequestResponse getCurrentUserRequestById(Long id) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Employee employee = requireLinkedEmployee(user);

        EmployeeProfileChangeRequest request = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request not found"));

        ensureCurrentEmployeeOwnsRequest(request, employee);

        return mapper.toResponse(request);
    }

    @Override
    @Transactional
    public EmployeeProfileChangeRequestResponse cancelCurrentUserRequest(Long id) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Employee employee = requireLinkedEmployee(user);

        EmployeeProfileChangeRequest request = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request not found"));

        ensureCurrentEmployeeOwnsRequest(request, employee);

        if (request.getStatus() != EmployeeProfileChangeRequestStatus.PENDING) {
            throw new ConflictException("Only pending profile change requests can be cancelled");
        }

        request.setStatus(EmployeeProfileChangeRequestStatus.CANCELLED);
        EmployeeProfileChangeRequest saved = repository.save(request);
        auditFacade.recordStatusChange(
                "EmployeeProfileChangeRequest",
                saved.getId(),
                requestIdentifier(saved),
                "status",
                EmployeeProfileChangeRequestStatus.PENDING,
                EmployeeProfileChangeRequestStatus.CANCELLED
        );
        auditFacade.log(
                "CANCEL_PROFILE_CHANGE_REQUEST",
                "EmployeeProfileChangeRequest",
                saved.getId(),
                requestIdentifier(saved),
                "Cancelled employee profile change request"
        );
        recordProfileDomainEvent(saved, DomainEventType.SYSTEM_EVENT, "Employee profile change request cancelled");
        return mapper.toResponse(saved);
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmployeeProfileChangeRequestResponse> getReviewRequests(EmployeeProfileChangeRequestStatus status, Pageable pageable) {
        User reviewer = authenticatedUserProvider.getAuthenticatedUser();

        Page<EmployeeProfileChangeRequest> page;
        if (authenticatedUserProvider.isOverlord()) {
            page = status == null
                    ? repository.findAll(pageable)
                    : repository.findAllByStatus(status, pageable);
        } else {
            Long companyId = requireReviewerCompanyId(reviewer);
            page = status == null
                    ? repository.findAllByCompany_Id(companyId, pageable)
                    : repository.findAllByCompany_IdAndStatus(companyId, status, pageable);
        }

        return PageResponse.fromContent(page.map(mapper::toResponse).getContent(), page);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeProfileChangeRequestResponse getReviewRequestById(Long id) {
        EmployeeProfileChangeRequest request = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request not found"));
        ensureReviewerCanAccess(request);
        return mapper.toResponse(request);
    }

    @Override
    @Transactional
    public EmployeeProfileChangeRequestResponse approveReviewRequest(Long id) {
        User reviewer = authenticatedUserProvider.getAuthenticatedUser();
        EmployeeProfileChangeRequest request = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request not found"));
        ensureReviewerCanAccess(request);

        if (request.getStatus() != EmployeeProfileChangeRequestStatus.PENDING) {
            throw new ConflictException("Only pending profile change requests can be approved");
        }

        Map<String, Object> requestedChanges = mapper.fromJson(request.getRequestedChangesJson());
        applyRequestedChanges(request, requestedChanges);

        request.setStatus(EmployeeProfileChangeRequestStatus.APPLIED);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(null);

        EmployeeProfileChangeRequest saved = repository.save(request);
        auditFacade.recordStatusChange(
                "EmployeeProfileChangeRequest",
                saved.getId(),
                requestIdentifier(saved),
                "status",
                EmployeeProfileChangeRequestStatus.PENDING,
                EmployeeProfileChangeRequestStatus.APPLIED
        );
        auditFacade.log(
                "APPROVE_PROFILE_CHANGE_REQUEST",
                "EmployeeProfileChangeRequest",
                saved.getId(),
                requestIdentifier(saved),
                "Approved and applied employee profile change request"
        );
        notifyRequestOwner(saved, "Profile change request applied", "Your profile change request has been approved and applied.", NotificationType.SUCCESS, NotificationSeverity.SUCCESS);
        recordProfileDomainEvent(saved, DomainEventType.SYSTEM_EVENT, "Employee profile change request approved and applied");

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeProfileChangeRequestResponse rejectReviewRequest(Long id, EmployeeProfileChangeRequestReview dto) {
        User reviewer = authenticatedUserProvider.getAuthenticatedUser();
        EmployeeProfileChangeRequest request = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request not found"));
        ensureReviewerCanAccess(request);

        if (request.getStatus() != EmployeeProfileChangeRequestStatus.PENDING) {
            throw new ConflictException("Only pending profile change requests can be rejected");
        }

        String rejectionReason = normalizeOptionalString(dto == null ? null : dto.getRejectionReason(), 1000, "rejectionReason");
        if (rejectionReason == null) {
            throw new BadRequestException("Rejection reason is required");
        }

        request.setStatus(EmployeeProfileChangeRequestStatus.REJECTED);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(rejectionReason);

        EmployeeProfileChangeRequest saved = repository.save(request);
        auditFacade.recordStatusChange(
                "EmployeeProfileChangeRequest",
                saved.getId(),
                requestIdentifier(saved),
                "status",
                EmployeeProfileChangeRequestStatus.PENDING,
                EmployeeProfileChangeRequestStatus.REJECTED
        );
        auditFacade.log(
                "REJECT_PROFILE_CHANGE_REQUEST",
                "EmployeeProfileChangeRequest",
                saved.getId(),
                requestIdentifier(saved),
                "Rejected employee profile change request"
        );
        notifyRequestOwner(saved, "Profile change request rejected", "Your profile change request has been rejected.", NotificationType.WARNING, NotificationSeverity.WARNING);
        recordProfileDomainEvent(saved, DomainEventType.SYSTEM_EVENT, "Employee profile change request rejected");

        return mapper.toResponse(saved);
    }


    private void applyRequestedChanges(EmployeeProfileChangeRequest request, Map<String, Object> requestedChanges) {
        if (requestedChanges == null || requestedChanges.isEmpty()) {
            throw new BadRequestException("Profile change request has no requested changes");
        }

        Employee employee = request.getEmployee();
        if (employee == null || employee.getId() == null) {
            throw new BadRequestException("Profile change request is not linked to an employee");
        }

        for (Map.Entry<String, Object> entry : requestedChanges.entrySet()) {
            String field = normalizeFieldName(entry.getKey());
            Object value = entry.getValue();

            switch (field) {
                case "phoneCode" -> applyEmployeeField(request, employee, field, employee.getPhoneCode(), value, v -> employee.setPhoneCode(asNullableString(v)));
                case "phoneNumber" -> applyEmployeeField(request, employee, field, employee.getPhoneNumber(), value, v -> employee.setPhoneNumber(asRequiredString(field, v)));
                case "address" -> applyEmployeeField(request, employee, field, employee.getAddress(), value, v -> employee.setAddress(asNullableString(v)));
                case "postalCode" -> applyEmployeeField(request, employee, field, employee.getPostalCode(), value, v -> employee.setPostalCode(asNullableString(v)));
                case "email" -> applyEmailChange(request, employee, value);
                case "cityId" -> applyCityChange(request, employee, value);
                case "countryId" -> applyCountryChange(request, employee, value);
                case "timezoneId" -> applyTimezoneChange(request, employee, value);
                default -> throw new BadRequestException("Unsupported profile change field: " + field);
            }
        }

        employeeRepository.save(employee);
        User linkedUser = employee.getUser();
        if (linkedUser != null && linkedUser.getId() != null) {
            userRepository.save(linkedUser);
        }
    }

    private void applyEmailChange(EmployeeProfileChangeRequest request, Employee employee, Object value) {
        String newEmail = asRequiredString("email", value).toLowerCase(Locale.ROOT);
        String oldEmployeeEmail = employee.getEmail();
        if (Objects.equals(oldEmployeeEmail, newEmail)) {
            return;
        }

        Long companyId = employee.getCompany() != null ? employee.getCompany().getId() : null;
        if (companyId != null && employeeRepository.existsByEmailIgnoreCaseAndCompany_IdAndIdNot(newEmail, companyId, employee.getId())) {
            throw new ConflictException("Employee email already exists in this company");
        }

        User linkedUser = employee.getUser();
        if (linkedUser != null && linkedUser.getId() != null && userRepository.existsByEmailIgnoreCaseAndIdNot(newEmail, linkedUser.getId())) {
            throw new ConflictException("User email already exists");
        }
        if (linkedUser == null && userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new ConflictException("User email already exists");
        }

        employee.setEmail(newEmail);
        employee.setEmailManuallyOverridden(true);
        employee.setAutoGeneratedEmail(false);
        employee.setEmailGenerationSource("PROFILE_CHANGE_REQUEST");
        auditFacade.recordFieldChange("Employee", employee.getId(), employeeIdentifier(employee), "email", oldEmployeeEmail, newEmail);

        if (linkedUser != null && linkedUser.getId() != null) {
            String oldUserEmail = linkedUser.getEmail();
            linkedUser.setEmail(newEmail);
            auditFacade.recordFieldChange("User", linkedUser.getId(), userIdentifier(linkedUser), "email", oldUserEmail, newEmail);
        }
    }

    private void applyCityChange(EmployeeProfileChangeRequest request, Employee employee, Object value) {
        Long cityId = asNullableLong(value);
        City newCity = cityId == null ? null : cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found"));
        Long oldId = employee.getCity() != null ? employee.getCity().getId() : null;
        if (Objects.equals(oldId, cityId)) {
            return;
        }
        employee.setCity(newCity);
        auditFacade.recordFieldChange("Employee", employee.getId(), employeeIdentifier(employee), "cityId", oldId, cityId);
    }

    private void applyCountryChange(EmployeeProfileChangeRequest request, Employee employee, Object value) {
        Long countryId = asNullableLong(value);
        Country newCountry = countryId == null ? null : countryRepository.findById(countryId)
                .orElseThrow(() -> new ResourceNotFoundException("Country not found"));
        Long oldId = employee.getCountry() != null ? employee.getCountry().getId() : null;
        if (Objects.equals(oldId, countryId)) {
            return;
        }
        employee.setCountry(newCountry);
        auditFacade.recordFieldChange("Employee", employee.getId(), employeeIdentifier(employee), "countryId", oldId, countryId);
    }

    private void applyTimezoneChange(EmployeeProfileChangeRequest request, Employee employee, Object value) {
        Long timezoneId = asNullableLong(value);
        Timezone newTimezone = timezoneId == null ? null : timezoneRepository.findById(timezoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Timezone not found"));
        Long oldId = employee.getTimezone() != null ? employee.getTimezone().getId() : null;
        if (Objects.equals(oldId, timezoneId)) {
            return;
        }
        employee.setTimezone(newTimezone);
        auditFacade.recordFieldChange("Employee", employee.getId(), employeeIdentifier(employee), "timezoneId", oldId, timezoneId);
    }

    private void applyEmployeeField(EmployeeProfileChangeRequest request, Employee employee, String field, Object oldValue, Object newValue, java.util.function.Consumer<Object> setter) {
        String normalizedNewValue = newValue == null ? null : String.valueOf(newValue).trim();
        if (normalizedNewValue != null && normalizedNewValue.isBlank()) {
            normalizedNewValue = null;
        }
        if (Objects.equals(oldValue, normalizedNewValue)) {
            return;
        }
        setter.accept(normalizedNewValue);
        auditFacade.recordFieldChange("Employee", employee.getId(), employeeIdentifier(employee), field, oldValue, normalizedNewValue);
    }

    private String asNullableString(Object value) {
        if (value == null) {
            return null;
        }
        String normalized = String.valueOf(value).trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String asRequiredString(String field, Object value) {
        String normalized = asNullableString(value);
        if (normalized == null) {
            throw new BadRequestException("Profile field cannot be empty: " + field);
        }
        return normalized;
    }

    private Long asNullableLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number numberValue) {
            return numberValue.longValue();
        }
        String text = String.valueOf(value).trim();
        if (text.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Profile field must be a valid id");
        }
    }

    private void recordProfileDomainEvent(EmployeeProfileChangeRequest request, DomainEventType eventType, String summary) {
        if (request == null || request.getEmployee() == null || request.getEmployee().getId() == null) {
            return;
        }
        Long companyId = request.getCompany() != null ? request.getCompany().getId() : null;
        domainEventService.record(
                eventType,
                OperationalEntityType.EMPLOYEE,
                request.getEmployee().getId(),
                employeeIdentifier(request.getEmployee()),
                summary,
                request.getRequestedChangesJson(),
                companyId
        );
    }

    private void notifyRequestOwner(EmployeeProfileChangeRequest request, String title, String message, NotificationType type, NotificationSeverity severity) {
        User recipient = request.getRequestedBy();
        if (recipient == null || recipient.getId() == null) {
            return;
        }
        notificationService.createOperationalNotification(
                recipient.getId(),
                title,
                message,
                type,
                severity,
                NotificationCategory.GENERAL,
                NotificationSourceType.USER,
                request.getId(),
                "employee-profile-change-request-" + request.getId() + "-" + request.getStatus()
        );
    }

    private String requestIdentifier(EmployeeProfileChangeRequest request) {
        return request == null || request.getId() == null ? null : "EPCR-" + request.getId();
    }

    private String employeeIdentifier(Employee employee) {
        if (employee == null || employee.getId() == null) {
            return null;
        }
        String name = ((employee.getFirstName() == null ? "" : employee.getFirstName()) + " " + (employee.getLastName() == null ? "" : employee.getLastName())).trim();
        return name.isBlank() ? "Employee #" + employee.getId() : name;
    }

    private String userIdentifier(User user) {
        if (user == null || user.getId() == null) {
            return null;
        }
        return user.getEmail() == null ? "User #" + user.getId() : user.getEmail();
    }

    private void ensureCurrentEmployeeOwnsRequest(EmployeeProfileChangeRequest request, Employee employee) {
        if (request.getEmployee() == null || request.getEmployee().getId() == null || !request.getEmployee().getId().equals(employee.getId())) {
            throw new ForbiddenException("You can access only your own profile change requests");
        }
    }


    private void ensureReviewerCanAccess(EmployeeProfileChangeRequest request) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        Long requestCompanyId = request.getCompany() != null ? request.getCompany().getId() : null;
        Long reviewerCompanyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        if (requestCompanyId == null || !requestCompanyId.equals(reviewerCompanyId)) {
            throw new ForbiddenException("You can review only profile change requests from your company");
        }
    }

    private Long requireReviewerCompanyId(User reviewer) {
        if (reviewer == null || reviewer.getCompany() == null || reviewer.getCompany().getId() == null) {
            throw new ForbiddenException("Authenticated reviewer is not assigned to a company");
        }
        return reviewer.getCompany().getId();
    }

    private Employee requireLinkedEmployee(User user) {
        if (user == null || user.getEmployee() == null || user.getEmployee().getId() == null) {
            throw new ForbiddenException("Authenticated user is not linked to an employee profile");
        }
        return user.getEmployee();
    }

    private Map<String, Object> normalizeAndValidateRequestedChanges(Map<String, Object> requestedChanges) {
        if (requestedChanges == null || requestedChanges.isEmpty()) {
            throw new BadRequestException("At least one profile change is required");
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : requestedChanges.entrySet()) {
            String field = normalizeFieldName(entry.getKey());
            if (!ALLOWED_FIELDS.contains(field)) {
                throw new BadRequestException("Profile field is not allowed for change request: " + entry.getKey());
            }
            if (normalized.containsKey(field)) {
                throw new BadRequestException("Duplicate profile change field: " + field);
            }

            Object value = entry.getValue();
            if (STRING_FIELDS.contains(field)) {
                normalized.put(field, normalizeStringField(field, value));
            } else if (ID_FIELDS.contains(field)) {
                normalized.put(field, normalizeIdField(field, value));
            } else {
                throw new BadRequestException("Unsupported profile change field: " + field);
            }
        }

        if (normalized.isEmpty()) {
            throw new BadRequestException("At least one profile change is required");
        }

        return normalized;
    }

    private String normalizeFieldName(String fieldName) {
        if (fieldName == null || fieldName.isBlank()) {
            throw new BadRequestException("Profile change field name is required");
        }
        return fieldName.trim();
    }

    private String normalizeStringField(String field, Object value) {
        if (value == null) {
            return null;
        }
        if (!(value instanceof String stringValue)) {
            throw new BadRequestException("Profile field must be a string: " + field);
        }

        String normalized = stringValue.trim();
        if (normalized.isBlank()) {
            return null;
        }

        if ("email".equals(field)) {
            normalized = normalized.toLowerCase(Locale.ROOT);
            if (normalized.length() > 255 || !EMAIL_PATTERN.matcher(normalized).matches()) {
                throw new BadRequestException("Email is not valid");
            }
            return normalized;
        }

        return switch (field) {
            case "phoneCode" -> limit(normalized, 10, field);
            case "phoneNumber" -> limit(normalized, 30, field);
            case "address" -> limit(normalized, 200, field);
            case "postalCode" -> limit(normalized, 20, field);
            default -> throw new BadRequestException("Unsupported string profile field: " + field);
        };
    }

    private Long normalizeIdField(String field, Object value) {
        if (value == null) {
            return null;
        }

        Long normalized;
        if (value instanceof Number numberValue) {
            normalized = numberValue.longValue();
        } else if (value instanceof String stringValue && !stringValue.isBlank()) {
            try {
                normalized = Long.parseLong(stringValue.trim());
            } catch (NumberFormatException ex) {
                throw new BadRequestException("Profile field must be a valid id: " + field);
            }
        } else {
            throw new BadRequestException("Profile field must be a valid id: " + field);
        }

        if (normalized <= 0) {
            throw new BadRequestException("Profile field id must be positive: " + field);
        }
        return normalized;
    }

    private String normalizeOptionalString(String value, int maxLength, String field) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            return null;
        }
        return limit(normalized, maxLength, field);
    }

    private String limit(String value, int maxLength, String field) {
        if (value.length() > maxLength) {
            throw new BadRequestException("Profile field is too long: " + field);
        }
        return value;
    }
}
