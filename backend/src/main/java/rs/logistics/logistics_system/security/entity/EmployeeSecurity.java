package rs.logistics.logistics_system.security.entity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.security.RoleCatalog;

@Component("employeeSecurity")
@RequiredArgsConstructor
public class EmployeeSecurity {

    private final EmployeeRepository employeeRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public boolean canRead(Long employeeId) {
        if (employeeId == null) {
            return false;
        }

        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyId();
        if (companyId == null) {
            return false;
        }

        return employeeRepository.findByIdAndCompany_Id(employeeId, companyId)
                .map(employee -> {
                    if (authenticatedUserProvider.isCurrentUser(employee.getUser())) {
                        return true;
                    }

                    if (authenticatedUserProvider.hasAnyRole(RoleCatalog.COMPANY_ADMIN, RoleCatalog.HR_MANAGER, RoleCatalog.DISPATCHER)) {
                        return true;
                    }

                    if (authenticatedUserProvider.hasRole(RoleCatalog.WAREHOUSE_MANAGER)) {
                        Long managerEmployeeId = authenticatedUserProvider.getAuthenticatedUser().getEmployee() != null
                                ? authenticatedUserProvider.getAuthenticatedUser().getEmployee().getId()
                                : null;
                        return managerEmployeeId != null
                                && employeeRepository.isVisibleToWarehouseManager(employee.getId(), companyId, managerEmployeeId);
                    }

                    return false;
                })
                .orElse(false);
    }

    public boolean isSelf(Long employeeId) {
        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyId();
        if (companyId == null) {
            return false;
        }

        return employeeRepository.findByIdAndCompany_Id(employeeId, companyId)
                .map(employee -> authenticatedUserProvider.isCurrentUser(employee.getUser()))
                .orElse(false);
    }
}
