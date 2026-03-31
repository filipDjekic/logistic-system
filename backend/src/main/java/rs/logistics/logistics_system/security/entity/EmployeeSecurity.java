package rs.logistics.logistics_system.security.entity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

@Component("employeeSecurity")
@RequiredArgsConstructor
public class EmployeeSecurity {

    private final EmployeeRepository employeeRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public boolean isSelf(Long employeeId) {
        return employeeRepository.findById(employeeId).map(employee -> employee.getUser() != null && employee.getUser().getId().equals(authenticatedUserProvider.getAuthenticatedUserId())).orElse(false);
    }
}
