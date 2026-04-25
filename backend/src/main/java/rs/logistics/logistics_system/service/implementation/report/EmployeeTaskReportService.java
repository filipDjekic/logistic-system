package rs.logistics.logistics_system.service.implementation.report;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.report.EmployeeTaskReportResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.report.EmployeeTaskReportServiceDefinition;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeTaskReportService implements EmployeeTaskReportServiceDefinition {

    private final EmployeeRepository employeeRepository;
    private final TaskRepository taskRepository;
    private final ShiftRepository shiftRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional(readOnly = true)
    public EmployeeTaskReportResponse getEmployeeTaskReport(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long employeeId,
            EmployeePosition position,
            TaskStatus taskStatus,
            TaskPriority taskPriority
    ) {
        validateDateRange(fromDate, toDate);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        List<Employee> employees = companyId == null
                ? employeeRepository.findAll()
                : employeeRepository.findAllByCompany_Id(companyId);

        employees = employees.stream()
                .filter(employee -> employeeId == null || Objects.equals(employee.getId(), employeeId))
                .filter(employee -> position == null || employee.getPosition() == position)
                .toList();

        Set<Long> employeeIds = employees.stream()
                .map(Employee::getId)
                .collect(Collectors.toSet());

        List<Task> tasks = companyId == null
                ? taskRepository.findAll()
                : taskRepository.findAllByAssignedEmployee_Company_Id(companyId);

        tasks = tasks.stream()
                .filter(task -> task.getAssignedEmployee() != null && employeeIds.contains(task.getAssignedEmployee().getId()))
                .filter(task -> taskStatus == null || task.getStatus() == taskStatus)
                .filter(task -> taskPriority == null || task.getPriority() == taskPriority)
                .filter(task -> isWithinDateRange(task.getCreatedAt(), fromDate, toDate)
                        || isWithinDateRange(task.getDueDate(), fromDate, toDate))
                .toList();

        List<Shift> shifts = companyId == null
                ? shiftRepository.findAll()
                : shiftRepository.findAllByEmployee_Company_Id(companyId);

        shifts = shifts.stream()
                .filter(shift -> shift.getEmployee() != null && employeeIds.contains(shift.getEmployee().getId()))
                .filter(shift -> isShiftWithinDateRange(shift, fromDate, toDate))
                .toList();

        LocalDateTime now = LocalDateTime.now();
        Set<Long> employeesWithTasks = tasks.stream()
                .filter(task -> task.getAssignedEmployee() != null)
                .map(task -> task.getAssignedEmployee().getId())
                .collect(Collectors.toSet());

        return new EmployeeTaskReportResponse(
                fromDate,
                toDate,
                employees.size(),
                employees.stream().filter(employee -> Boolean.TRUE.equals(employee.getActive())).count(),
                employees.stream().filter(employee -> !Boolean.TRUE.equals(employee.getActive())).count(),
                tasks.size(),
                tasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count(),
                tasks.stream().filter(task -> isOpenTask(task)).count(),
                tasks.stream().filter(task -> isOverdueOpenTask(task, now)).count(),
                shifts.size(),
                employees.stream().filter(employee -> Boolean.TRUE.equals(employee.getActive()) && !employeesWithTasks.contains(employee.getId())).count(),
                countByEnum(employees, Employee::getPosition, EmployeePosition.values()),
                countByEnum(tasks, Task::getStatus, TaskStatus.values()),
                countByEnum(tasks, Task::getPriority, TaskPriority.values()),
                countByEnum(shifts, Shift::getStatus, ShiftStatus.values()),
                buildTasksByAssignee(employees, tasks, now),
                buildEmployeeRows(employees, tasks, shifts),
                buildTaskRows(tasks),
                buildShiftRows(shifts)
        );
    }

    private void validateDateRange(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate cannot be after toDate");
        }
    }

    private boolean isWithinDateRange(LocalDateTime value, LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate == null && toDate == null) {
            return true;
        }

        if (value == null) {
            return false;
        }

        return (fromDate == null || !value.isBefore(fromDate))
                && (toDate == null || !value.isAfter(toDate));
    }

    private boolean isShiftWithinDateRange(Shift shift, LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate == null && toDate == null) {
            return true;
        }

        LocalDateTime start = shift.getStartTime();
        LocalDateTime end = shift.getEndTime();

        if (start == null || end == null) {
            return false;
        }

        return (toDate == null || !start.isAfter(toDate))
                && (fromDate == null || !end.isBefore(fromDate));
    }

    private boolean isOpenTask(Task task) {
        return task.getStatus() == TaskStatus.NEW || task.getStatus() == TaskStatus.IN_PROGRESS;
    }

    private boolean isOverdueOpenTask(Task task, LocalDateTime now) {
        return isOpenTask(task) && task.getDueDate() != null && task.getDueDate().isBefore(now);
    }

    private <T, E extends Enum<E>> Map<String, Long> countByEnum(
            List<T> rows,
            Function<T, E> extractor,
            E[] values
    ) {
        Map<E, Long> grouped = rows.stream()
                .map(extractor)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        Map<String, Long> result = new LinkedHashMap<>();
        for (E value : values) {
            result.put(value.name(), grouped.getOrDefault(value, 0L));
        }
        return result;
    }

    private List<EmployeeTaskReportResponse.TaskAssigneeSummaryResponse> buildTasksByAssignee(
            List<Employee> employees,
            List<Task> tasks,
            LocalDateTime now
    ) {
        Map<Long, Employee> employeeById = employees.stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        return tasks.stream()
                .filter(task -> task.getAssignedEmployee() != null)
                .collect(Collectors.groupingBy(task -> task.getAssignedEmployee().getId()))
                .entrySet()
                .stream()
                .map(entry -> {
                    Employee employee = employeeById.get(entry.getKey());
                    List<Task> group = entry.getValue();
                    return new EmployeeTaskReportResponse.TaskAssigneeSummaryResponse(
                            entry.getKey(),
                            employee != null ? fullName(employee) : "Unknown employee",
                            employee != null && employee.getPosition() != null ? employee.getPosition().name() : null,
                            group.size(),
                            group.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count(),
                            group.stream().filter(this::isOpenTask).count(),
                            group.stream().filter(task -> isOverdueOpenTask(task, now)).count()
                    );
                })
                .sorted(Comparator.comparing(EmployeeTaskReportResponse.TaskAssigneeSummaryResponse::tasksTotal).reversed())
                .toList();
    }

    private List<EmployeeTaskReportResponse.EmployeeTaskReportRowResponse> buildEmployeeRows(
            List<Employee> employees,
            List<Task> tasks,
            List<Shift> shifts
    ) {
        Map<Long, List<Task>> tasksByEmployee = tasks.stream()
                .filter(task -> task.getAssignedEmployee() != null)
                .collect(Collectors.groupingBy(task -> task.getAssignedEmployee().getId()));

        Map<Long, List<Shift>> shiftsByEmployee = shifts.stream()
                .filter(shift -> shift.getEmployee() != null)
                .collect(Collectors.groupingBy(shift -> shift.getEmployee().getId()));

        return employees.stream()
                .sorted(Comparator.comparing(Employee::getId).reversed())
                .map(employee -> {
                    List<Task> employeeTasks = tasksByEmployee.getOrDefault(employee.getId(), List.of());
                    List<Shift> employeeShifts = shiftsByEmployee.getOrDefault(employee.getId(), List.of());
                    return new EmployeeTaskReportResponse.EmployeeTaskReportRowResponse(
                            employee.getId(),
                            fullName(employee),
                            employee.getEmail(),
                            employee.getPosition() != null ? employee.getPosition().name() : null,
                            employee.getActive(),
                            employee.getEmploymentDate(),
                            employee.getUser() != null ? employee.getUser().getId() : null,
                            employeeTasks.size(),
                            employeeTasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count(),
                            employeeTasks.stream().filter(this::isOpenTask).count(),
                            employeeShifts.size()
                    );
                })
                .toList();
    }

    private List<EmployeeTaskReportResponse.TaskReportRowResponse> buildTaskRows(List<Task> tasks) {
        return tasks.stream()
                .sorted(Comparator.comparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(task -> new EmployeeTaskReportResponse.TaskReportRowResponse(
                        task.getId(),
                        task.getTitle(),
                        task.getStatus() != null ? task.getStatus().name() : null,
                        task.getPriority() != null ? task.getPriority().name() : null,
                        task.getDueDate(),
                        task.getCreatedAt(),
                        task.getAssignedEmployee() != null ? task.getAssignedEmployee().getId() : null,
                        task.getAssignedEmployee() != null ? fullName(task.getAssignedEmployee()) : null,
                        task.getAssignedEmployee() != null && task.getAssignedEmployee().getPosition() != null
                                ? task.getAssignedEmployee().getPosition().name()
                                : null,
                        task.getTransportOrder() != null ? task.getTransportOrder().getId() : null,
                        task.getStockMovement() != null ? task.getStockMovement().getId() : null
                ))
                .toList();
    }

    private List<EmployeeTaskReportResponse.ShiftReportRowResponse> buildShiftRows(List<Shift> shifts) {
        return shifts.stream()
                .sorted(Comparator.comparing(Shift::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(shift -> new EmployeeTaskReportResponse.ShiftReportRowResponse(
                        shift.getId(),
                        shift.getStatus() != null ? shift.getStatus().name() : null,
                        shift.getStartTime(),
                        shift.getEndTime(),
                        shift.getEmployee() != null ? shift.getEmployee().getId() : null,
                        shift.getEmployee() != null ? fullName(shift.getEmployee()) : null,
                        shift.getEmployee() != null && shift.getEmployee().getPosition() != null
                                ? shift.getEmployee().getPosition().name()
                                : null
                ))
                .toList();
    }

    private String fullName(Employee employee) {
        return String.join(" ", List.of(
                employee.getFirstName() != null ? employee.getFirstName() : "",
                employee.getLastName() != null ? employee.getLastName() : ""
        )).trim();
    }
}
