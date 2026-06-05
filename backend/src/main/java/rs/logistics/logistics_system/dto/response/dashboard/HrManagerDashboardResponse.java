package rs.logistics.logistics_system.dto.response.dashboard;

import java.util.List;
import java.util.Map;

public record HrManagerDashboardResponse(
        long employeesTotal,
        long activeEmployees,
        long inactiveEmployees,
        Map<String, Long> employeesByPosition,
        long activeShifts,
        long plannedShifts,
        long employeesWithoutActiveOrPlannedShift,
        long newEmployeesLast30Days,
        long deactivatedEmployees,
        long hrTasksTotal,
        Map<String, Long> hrTasksByStatus,
        List<DashboardChartResponse> charts,
        List<DashboardAlertResponse> alerts
) {
}