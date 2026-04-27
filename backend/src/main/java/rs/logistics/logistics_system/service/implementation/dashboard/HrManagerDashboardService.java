package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.dashboard.HrManagerDashboardResponse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.dashboard.HrManagerDashboardServiceDefinition;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HrManagerDashboardService implements HrManagerDashboardServiceDefinition {

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final ShiftRepository shiftRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    public HrManagerDashboardResponse getOverview() {
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        LocalDateTime now = LocalDateTime.now();
        LocalDate newEmployeeThreshold = LocalDate.now().minusDays(30);

        return new HrManagerDashboardResponse(
                employeeRepository.countByCompany_Id(companyId),
                employeeRepository.countByCompany_IdAndActiveTrue(companyId),
                employeeRepository.countByCompany_IdAndActiveFalse(companyId),
                countEmployeesByPosition(companyId),
                shiftRepository.countActiveForCompany(companyId, now),
                shiftRepository.countPlannedForCompany(companyId, now),
                employeeRepository.countActiveEmployeesWithoutActiveOrPlannedShift(companyId, now),
                employeeRepository.countByCompany_IdAndEmploymentDateGreaterThanEqual(companyId, newEmployeeThreshold),
                employeeRepository.countByCompany_IdAndActiveFalse(companyId),
                taskRepository.countHrTasksByCompany(companyId),
                countHrTasksByStatus(companyId)
        );
    }

    private Map<String, Long> countEmployeesByPosition(Long companyId) {
        Map<String, Long> result = emptyEnumMap(EmployeePosition.values());
        employeeRepository.countGroupedByPositionAndCompany(companyId)
                .forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private Map<String, Long> countHrTasksByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        taskRepository.countHrTasksGroupedByStatusAndCompany(companyId)
                .forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private Map<String, Long> emptyEnumMap(Enum<?>[] values) {
        Map<String, Long> result = new LinkedHashMap<>();
        Arrays.stream(values).forEach(value -> result.put(value.name(), 0L));
        return result;
    }
}
