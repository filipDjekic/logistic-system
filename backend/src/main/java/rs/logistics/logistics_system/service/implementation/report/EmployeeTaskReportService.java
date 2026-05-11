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
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.definition.report.EmployeeTaskReportServiceDefinition;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final TimeServiceDefinition timeService;

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

        validateReportFilters(companyId, employeeId);

        List<Employee> employees = employeeRepository.searchReportEmployees(
                companyId,
                employeeId,
                position
        );

        List<Task> tasks = taskRepository.searchReportTasks(
                companyId,
                employeeId,
                position,
                taskStatus,
                taskPriority,
                fromDate,
                toDate
        );

        List<Shift> shifts = shiftRepository.searchReportShifts(
                companyId,
                employeeId,
                position,
                fromDate,
                toDate
        );

        LocalDateTime now = timeService.nowSystem();
        Set<Long> employeesWithTasks = tasks.stream()
                .filter(task -> task.getAssignedEmployee() != null)
                .map(task -> task.getAssignedEmployee().getId())
                .collect(Collectors.toSet());

        long activeEmployees = employees.stream().filter(employee -> Boolean.TRUE.equals(employee.getActive())).count();
        long completedTasks = tasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count();
        long openTasks = tasks.stream().filter(task -> isOpenTask(task)).count();
        long overdueOpenTasks = tasks.stream().filter(task -> isOverdueOpenTask(task, now)).count();
        long activeOrPlannedShifts = shifts.stream()
                .filter(shift -> shift.getStatus() == ShiftStatus.ACTIVE || shift.getStatus() == ShiftStatus.PLANNED)
                .map(shift -> shift.getEmployee() != null ? shift.getEmployee().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        return new EmployeeTaskReportResponse(
                fromDate,
                toDate,
                employees.size(),
                activeEmployees,
                employees.stream().filter(employee -> !Boolean.TRUE.equals(employee.getActive())).count(),
                tasks.size(),
                completedTasks,
                openTasks,
                overdueOpenTasks,
                percentage(completedTasks, tasks.size()),
                percentage(overdueOpenTasks, openTasks),
                average(tasks.size(), activeEmployees),
                percentage(activeOrPlannedShifts, activeEmployees),
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

    @Override
    @Transactional(readOnly = true)
    public byte[] exportEmployeeTaskReportCsv(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long employeeId,
            EmployeePosition position,
            TaskStatus taskStatus,
            TaskPriority taskPriority
    ) {
        EmployeeTaskReportResponse report = getEmployeeTaskReport(
                fromDate,
                toDate,
                employeeId,
                position,
                taskStatus,
                taskPriority
        );

        List<List<?>> rows = new java.util.ArrayList<>();
        rows.add(java.util.Arrays.asList("Employee task report"));
        rows.add(java.util.Arrays.asList("fromDate", report.fromDate(), "toDate", report.toDate()));
        rows.add(java.util.Arrays.asList("employeesTotal", report.employeesTotal(), "activeEmployees", report.activeEmployees(), "inactiveEmployees", report.inactiveEmployees()));
        rows.add(java.util.Arrays.asList("tasksTotal", report.tasksTotal(), "completedTasks", report.completedTasks(), "openTasks", report.openTasks(), "overdueOpenTasks", report.overdueOpenTasks()));
        rows.add(java.util.Arrays.asList("taskCompletionRate", report.taskCompletionRate(), "overdueOpenTaskRate", report.overdueOpenTaskRate(), "averageTasksPerActiveEmployee", report.averageTasksPerActiveEmployee(), "shiftCoverageRate", report.shiftCoverageRate()));
        rows.add(java.util.Arrays.asList("shiftsTotal", report.shiftsTotal(), "employeesWithoutTasks", report.employeesWithoutTasks()));

        ReportCsvExportHelper.addSectionTitle(rows, "Employee rows");
        rows.add(java.util.Arrays.asList("employeeId", "employeeName", "email", "position", "active", "employmentDate", "userId", "tasksTotal", "completedTasks", "openTasks", "shiftsTotal"));
        report.employeeRows().forEach(row -> rows.add(java.util.Arrays.asList(
                row.employeeId(),
                row.employeeName(),
                row.email(),
                row.position(),
                row.active(),
                row.employmentDate(),
                row.userId(),
                row.tasksTotal(),
                row.completedTasks(),
                row.openTasks(),
                row.shiftsTotal()
        )));

        ReportCsvExportHelper.addSectionTitle(rows, "Task rows");
        rows.add(java.util.Arrays.asList("taskId", "title", "status", "priority", "dueDate", "createdAt", "assignedEmployeeId", "assignedEmployeeName", "assignedEmployeePosition", "transportOrderId", "stockMovementId"));
        report.taskRows().forEach(row -> rows.add(java.util.Arrays.asList(
                row.taskId(),
                row.title(),
                row.status(),
                row.priority(),
                row.dueDate(),
                row.createdAt(),
                row.assignedEmployeeId(),
                row.assignedEmployeeName(),
                row.assignedEmployeePosition(),
                row.transportOrderId(),
                row.stockMovementId()
        )));

        ReportCsvExportHelper.addSectionTitle(rows, "Shift rows");
        rows.add(java.util.Arrays.asList("shiftId", "status", "startTime", "endTime", "employeeId", "employeeName", "employeePosition"));
        report.shiftRows().forEach(row -> rows.add(java.util.Arrays.asList(
                row.shiftId(),
                row.status(),
                row.startTime(),
                row.endTime(),
                row.employeeId(),
                row.employeeName(),
                row.employeePosition()
        )));

        ReportCsvExportHelper.addSectionTitle(rows, "Tasks by assignee");
        rows.add(java.util.Arrays.asList("employeeId", "employeeName", "position", "tasksTotal", "completedTasks", "openTasks", "overdueOpenTasks"));
        report.tasksByAssignee().forEach(row -> rows.add(java.util.Arrays.asList(row.employeeId(), row.employeeName(), row.position(), row.tasksTotal(), row.completedTasks(), row.openTasks(), row.overdueOpenTasks())));

        ReportCsvExportHelper.addSectionTitle(rows, "Employees by position");
        ReportCsvExportHelper.addMapRows(rows, report.employeesByPosition(), "position", "count");

        ReportCsvExportHelper.addSectionTitle(rows, "Tasks by status");
        ReportCsvExportHelper.addMapRows(rows, report.tasksByStatus(), "status", "count");

        ReportCsvExportHelper.addSectionTitle(rows, "Tasks by priority");
        ReportCsvExportHelper.addMapRows(rows, report.tasksByPriority(), "priority", "count");

        ReportCsvExportHelper.addSectionTitle(rows, "Shifts by status");
        ReportCsvExportHelper.addMapRows(rows, report.shiftsByStatus(), "status", "count");

        return ReportCsvExportHelper.toCsvBytes(rows);
    }

    private BigDecimal percentage(long part, long total) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal average(long total, long denominator) {
        if (denominator <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(total).divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);
    }

    private void validateReportFilters(Long companyId, Long employeeId) {
        if (authenticatedUserProvider.isOverlord() || employeeId == null) {
            return;
        }

        if (employeeRepository.findByIdAndCompany_Id(employeeId, companyId).isEmpty()) {
            throw new rs.logistics.logistics_system.exception.ForbiddenException("Employee is outside authenticated company scope");
        }
    }

    private void validateDateRange(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate cannot be after toDate");
        }
    }

    private boolean isOpenTask(Task task) {
        return task.getStatus() == TaskStatus.NEW || task.getStatus() == TaskStatus.IN_PROGRESS;
    }

    private boolean isOverdueOpenTask(Task task, LocalDateTime now) {
        if (!isOpenTask(task) || task.getDueDate() == null) {
            return false;
        }

        LocalDateTime effectiveNow = task.getAssignedEmployee() != null
                ? timeService.nowForEmployee(task.getAssignedEmployee())
                : now;

        return task.getDueDate().isBefore(effectiveNow);
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
                    List<Task> employeeTasks = tasksByEmployee.getOrDefault(employee.getId(), java.util.Arrays.asList());
                    List<Shift> employeeShifts = shiftsByEmployee.getOrDefault(employee.getId(), java.util.Arrays.asList());
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
        return String.join(" ", java.util.Arrays.asList(
                employee.getFirstName() != null ? employee.getFirstName() : "",
                employee.getLastName() != null ? employee.getLastName() : ""
        )).trim();
    }
}
