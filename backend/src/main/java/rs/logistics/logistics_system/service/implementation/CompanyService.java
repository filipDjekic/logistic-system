package rs.logistics.logistics_system.service.implementation;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.CompanyAdminCreate;
import rs.logistics.logistics_system.dto.create.CompanyCreate;
import rs.logistics.logistics_system.dto.response.CompanyResponse;
import rs.logistics.logistics_system.dto.update.CompanyUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.CompanyMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.CompanyServiceDefinition;

@Service
@RequiredArgsConstructor
public class CompanyService implements CompanyServiceDefinition {

    private static final EmployeePosition BOOTSTRAP_ADMIN_POSITION = EmployeePosition.COMPANY_ADMIN;
    private static final BigDecimal BOOTSTRAP_ADMIN_SALARY = BigDecimal.ONE;
    private static final UserStatus BOOTSTRAP_ADMIN_STATUS = UserStatus.ACTIVE;
    private static final String ROLE_COMPANY_ADMIN = "COMPANY_ADMIN";

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditFacadeDefinition auditFacade;

    @Override
    @Transactional
    public CompanyResponse create(CompanyCreate dto) {
        validateUniqueName(dto.getName(), null);
        validateAdminUniqueness(dto.getAdmin());

        Company company = CompanyMapper.toEntity(dto);
        Company savedCompany = companyRepository.save(company);

        Role companyAdminRole = roleRepository.findByName(ROLE_COMPANY_ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("COMPANY_ADMIN role not found"));

        String generatedUsername = generateUniqueUsername(dto.getAdmin().getFirstName(), dto.getAdmin().getLastName());
        String generatedEmail = generateUniqueEmail(generatedUsername, dto.getName());

        User adminUser = new User(
                passwordEncoder.encode(dto.getAdmin().getPassword()),
                dto.getAdmin().getFirstName(),
                dto.getAdmin().getLastName(),
                generatedEmail,
                BOOTSTRAP_ADMIN_STATUS,
                companyAdminRole
        );
        adminUser.setEnabled(true);
        adminUser.setCompany(savedCompany);

        User savedAdminUser = userRepository.save(adminUser);

        Employee adminEmployee = toEmployee(savedCompany, savedAdminUser, dto.getAdmin(), generatedEmail);
        Employee savedAdminEmployee = employeeRepository.save(adminEmployee);

        auditFacade.recordCreate("COMPANY", savedCompany.getId(), savedCompany.getName());
        auditFacade.log(
                "CREATE",
                "COMPANY",
                savedCompany.getId(),
                savedCompany.getName(),
                "COMPANY is created with bootstrap COMPANY_ADMIN (companyId=" + savedCompany.getId()
                        + ", adminUserId=" + savedAdminUser.getId()
                        + ", generatedUsername=" + generatedUsername
                        + ", generatedEmail=" + generatedEmail + ")"
        );

        auditFacade.recordCreate("USER", savedAdminUser.getId(), savedAdminUser.getEmail());
        auditFacade.recordFieldChange("USER", savedAdminUser.getId(), "company_id", null, savedCompany.getId());
        auditFacade.recordFieldChange("USER", savedAdminUser.getId(), "role", null, ROLE_COMPANY_ADMIN);
        auditFacade.recordFieldChange("USER", savedAdminUser.getId(), "status", null, BOOTSTRAP_ADMIN_STATUS.name());
        auditFacade.log(
                "CREATE",
                "USER",
                savedAdminUser.getId(),
                savedAdminUser.getEmail(),
                "Bootstrap COMPANY_ADMIN user created automatically for company " + savedCompany.getName()
        );

        auditFacade.recordCreate("EMPLOYEE", savedAdminEmployee.getId(), savedAdminEmployee.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", savedAdminEmployee.getId(), "user_id", null, savedAdminUser.getId());
        auditFacade.recordFieldChange("EMPLOYEE", savedAdminEmployee.getId(), "company_id", null, savedCompany.getId());
        auditFacade.recordFieldChange("EMPLOYEE", savedAdminEmployee.getId(), "position", null, BOOTSTRAP_ADMIN_POSITION.name());
        auditFacade.log(
                "CREATE",
                "EMPLOYEE",
                savedAdminEmployee.getId(),
                savedAdminEmployee.getEmail(),
                "Bootstrap employee created automatically for company admin"
        );

        return CompanyMapper.toResponse(savedCompany);
    }

    @Override
    @Transactional
    public CompanyResponse update(Long id, CompanyUpdate dto) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        validateUniqueName(dto.getName(), id);

        String oldName = company.getName();
        Boolean oldActive = company.getActive();

        CompanyMapper.updateEntity(company, dto);
        Company saved = companyRepository.save(company);

        auditFacade.recordFieldChange("COMPANY", saved.getId(), saved.getName(), "name", oldName, saved.getName());
        auditFacade.recordFieldChange("COMPANY", saved.getId(), saved.getName(), "active", oldActive, saved.getActive());
        auditFacade.log(
                "UPDATE",
                "COMPANY",
                saved.getId(),
                saved.getName(),
                "COMPANY is updated (ID: " + saved.getId() + ", name: " + saved.getName() + ")"
        );

        return CompanyMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponse getById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        return CompanyMapper.toResponse(company);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyResponse> getAll() {
        return companyRepository.findAll()
                .stream()
                .map(CompanyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        validateDelete(company);

        companyRepository.delete(company);

        auditFacade.recordDelete("COMPANY", id, company.getName());
        auditFacade.log(
                "DELETE",
                "COMPANY",
                id,
                company.getName(),
                "COMPANY is deleted (ID: " + id + ", name: " + company.getName() + ")"
        );
    }

    private Employee toEmployee(Company company, User user, CompanyAdminCreate admin, String generatedEmail) {
        Employee employee = new Employee(
                admin.getFirstName(),
                admin.getLastName(),
                admin.getJmbg(),
                admin.getPhoneNumber(),
                generatedEmail,
                BOOTSTRAP_ADMIN_POSITION,
                admin.getEmploymentDate(),
                BOOTSTRAP_ADMIN_SALARY,
                user
        );
        employee.setCompany(company);
        return employee;
    }

    private void validateUniqueName(String name, Long companyId) {
        if (companyId == null) {
            if (companyRepository.existsByNameIgnoreCase(name)) {
                throw new ConflictException("Company with this name already exists");
            }
            return;
        }

        if (companyRepository.existsByNameIgnoreCaseAndIdNot(name, companyId)) {
            throw new ConflictException("Company with this name already exists");
        }
    }

    private void validateAdminUniqueness(CompanyAdminCreate admin) {
        if (employeeRepository.existsByJmbg(admin.getJmbg().trim())) {
            throw new ConflictException("Employee with this JMBG already exists");
        }
    }

    private void validateDelete(Company company) {
        if (!company.getUsers().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted while it still has users");
        }

        if (!company.getEmployees().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted while it still has employees");
        }

        if (!company.getVehicles().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted while it still has vehicles");
        }

        if (!company.getWarehouses().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted while it still has warehouses");
        }

        if (!company.getProducts().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted while it still has products");
        }
    }

    private String generateUniqueUsername(String firstName, String lastName) {
        String base = buildBaseUsername(firstName, lastName);
        String candidate = base;
        int suffix = 1;

        while (emailLocalPartExists(candidate)) {
            candidate = base + suffix;
            suffix++;
        }

        return candidate;
    }

    private String generateUniqueEmail(String username, String companyName) {
        String domain = buildCompanyDomain(companyName, BOOTSTRAP_ADMIN_POSITION.name());
        String candidate = username + "@" + domain;
        int suffix = 1;

        while (userRepository.existsByEmailIgnoreCase(candidate) || employeeRepository.existsByEmailIgnoreCase(candidate)) {
            candidate = username + suffix + "@" + domain;
            suffix++;
        }

        return candidate;
    }

    private boolean emailLocalPartExists(String localPart) {
        return userRepository.findAll().stream()
                .map(User::getEmail)
                .filter(email -> email != null && email.contains("@"))
                .map(email -> email.substring(0, email.indexOf('@')))
                .anyMatch(existing -> existing.equalsIgnoreCase(localPart));
    }

    private String buildBaseUsername(String firstName, String lastName) {
        String normalizedFirstName = normalizeForUsername(firstName, false);
        String normalizedLastName = normalizeForUsername(lastName, false);

        String joined = (normalizedFirstName + "." + normalizedLastName)
                .replaceAll("\\.+", ".")
                .replaceAll("^\\.|\\.$", "");

        if (joined.isBlank()) {
            throw new BadRequestException("Unable to generate bootstrap admin username");
        }

        return joined.length() > 40 ? joined.substring(0, 40) : joined;
    }

    private String buildCompanyDomain(String companyName, String position) {
        String companySlug = normalizeForUsername(companyName, true);

        if (companySlug.isBlank()) {
            throw new BadRequestException("Unable to generate company admin email domain");
        }

        String positionSlug = normalizeForUsername(position, true);

        if (positionSlug.isBlank()) {
            throw new BadRequestException("Unable to generate company admin email domain");
        }

        return companySlug + "." + positionSlug + ".rs";
    }

    private String normalizeForUsername(String value, boolean allowHyphen) {
        String normalized = Normalizer.normalize(value == null ? "" : value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);

        normalized = allowHyphen
                ? normalized.replaceAll("[^a-z0-9]+", "-")
                : normalized.replaceAll("[^a-z0-9]+", ".");

        normalized = normalized
                .replaceAll("[-.]{2,}", allowHyphen ? "-" : ".")
                .replaceAll("^[-.]+|[-.]+$", "");

        return normalized;
    }
}
