package rs.logistics.logistics_system.service.implementation;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.CompanyAdminCreate;
import rs.logistics.logistics_system.dto.create.CompanyCreate;
import rs.logistics.logistics_system.dto.create.UserEmployeeCreate;
import rs.logistics.logistics_system.dto.response.CompanyResponse;
import rs.logistics.logistics_system.dto.update.CompanyUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.entity.User;
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

        Role companyAdminRole = roleRepository.findByName("COMPANY_ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("COMPANY_ADMIN role not found"));

        User adminUser = new User(
                passwordEncoder.encode(dto.getAdmin().getPassword()),
                dto.getAdmin().getFirstName(),
                dto.getAdmin().getLastName(),
                dto.getAdmin().getEmail(),
                dto.getAdmin().getStatus(),
                companyAdminRole
        );
        adminUser.setEnabled(true);
        adminUser.setCompany(savedCompany);

        User savedAdminUser = userRepository.save(adminUser);

        Employee adminEmployee = toEmployee(savedCompany, savedAdminUser, dto.getAdmin(), dto.getAdmin().getEmployee());
        Employee savedAdminEmployee = employeeRepository.save(adminEmployee);

        auditFacade.recordCreate("COMPANY", savedCompany.getId(), savedCompany.getName());
        auditFacade.log(
                "CREATE",
                "COMPANY",
                savedCompany.getId(),
                savedCompany.getName(),
                "COMPANY is created with bootstrap COMPANY_ADMIN (companyId=" + savedCompany.getId() + ", adminUserId=" + savedAdminUser.getId() + ")"
        );

        auditFacade.recordCreate("USER", savedAdminUser.getId(), savedAdminUser.getEmail());
        auditFacade.recordFieldChange("USER", savedAdminUser.getId(), "company_id", null, savedCompany.getId());
        auditFacade.log(
                "CREATE",
                "USER",
                savedAdminUser.getId(),
                savedAdminUser.getEmail(),
                "Bootstrap COMPANY_ADMIN user created for company " + savedCompany.getName()
        );

        auditFacade.recordCreate("EMPLOYEE", savedAdminEmployee.getId(), savedAdminEmployee.getEmail());
        auditFacade.recordFieldChange("EMPLOYEE", savedAdminEmployee.getId(), "user_id", null, savedAdminUser.getId());
        auditFacade.recordFieldChange("EMPLOYEE", savedAdminEmployee.getId(), "company_id", null, savedCompany.getId());
        auditFacade.log(
                "CREATE",
                "EMPLOYEE",
                savedAdminEmployee.getId(),
                savedAdminEmployee.getEmail(),
                "Bootstrap employee created for company admin"
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

    private Employee toEmployee(Company company, User user, CompanyAdminCreate admin, UserEmployeeCreate employeeData) {
        Employee employee = new Employee(
                admin.getFirstName(),
                admin.getLastName(),
                employeeData.getJmbg(),
                employeeData.getPhoneNumber(),
                admin.getEmail(),
                employeeData.getPosition(),
                employeeData.getEmploymentDate(),
                employeeData.getSalary(),
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
        if (userRepository.existsByEmailIgnoreCase(admin.getEmail())) {
            throw new ConflictException("User with this email already exists");
        }

        if (employeeRepository.existsByEmailIgnoreCase(admin.getEmail())) {
            throw new ConflictException("Employee with this email already exists");
        }

        if (employeeRepository.existsByJmbg(admin.getEmployee().getJmbg().trim())) {
            throw new ConflictException("Employee with this JMBG already exists");
        }
    }

    private void validateDelete(Company company) {
        if (!company.getUsers().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted because it has users");
        }

        if (!company.getEmployees().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted because it has employees");
        }

        if (!company.getVehicles().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted because it has vehicles");
        }

        if (!company.getWarehouses().isEmpty()) {
            throw new BadRequestException("Company cannot be deleted because it has warehouses");
        }
    }
}