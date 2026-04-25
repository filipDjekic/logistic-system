package rs.logistics.logistics_system.dto.response.report;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record EmployeeTaskReportResponse(
        LocalDateTime fromDate,
        LocalDateTime toDate,
        long employeesTotal,
        long activeEmployees,
        long inactiveEmployees,
        long tasksTotal,
        long completedTasks,
        long openTasks,
        long overdueOpenTasks,
        long shiftsTotal,
        long employeesWithoutTasks,
        Map<String, Long> employeesByPosition,
        Map<String, Long> tasksByStatus,
        Map<String, Long> tasksByPriority,
        Map<String, Long> shiftsByStatus,
        List<TaskAssigneeSummaryResponse> tasksByAssignee,
        List<EmployeeTaskReportRowResponse> employeeRows,
        List<TaskReportRowResponse> taskRows,
        List<ShiftReportRowResponse> shiftRows
) {
    public record TaskAssigneeSummaryResponse(
            Long employeeId,
            String employeeName,
            String position,
            long tasksTotal,
            long completedTasks,
            long openTasks,
            long overdueOpenTasks
    ) {
    }

    public record EmployeeTaskReportRowResponse(
            Long employeeId,
            String employeeName,
            String email,
            String position,
            Boolean active,
            LocalDate employmentDate,
            Long userId,
            long tasksTotal,
            long completedTasks,
            long openTasks,
            long shiftsTotal
    ) {
    }

    public record TaskReportRowResponse(
            Long taskId,
            String title,
            String status,
            String priority,
            LocalDateTime dueDate,
            LocalDateTime createdAt,
            Long assignedEmployeeId,
            String assignedEmployeeName,
            String assignedEmployeePosition,
            Long transportOrderId,
            Long stockMovementId
    ) {
    }

    public record ShiftReportRowResponse(
            Long shiftId,
            String status,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Long employeeId,
            String employeeName,
            String employeePosition
    ) {
    }
}
