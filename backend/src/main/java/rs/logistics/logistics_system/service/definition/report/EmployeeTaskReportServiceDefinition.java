package rs.logistics.logistics_system.service.definition.report;

import rs.logistics.logistics_system.dto.response.report.EmployeeTaskReportResponse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.time.LocalDateTime;

public interface EmployeeTaskReportServiceDefinition {

    EmployeeTaskReportResponse getEmployeeTaskReport(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long employeeId,
            EmployeePosition position,
            TaskStatus taskStatus,
            TaskPriority taskPriority
    );
}
