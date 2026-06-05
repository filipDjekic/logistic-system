package rs.logistics.logistics_system.service.definition;

import java.util.List;
import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.create.EmployeeWithUserCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.enums.EmployeePosition;

public interface EmployeeServiceDefinition {

    EmployeeResponse create(EmployeeCreate dto);

    EmployeeResponse createWithUser(EmployeeWithUserCreate dto);

    EmployeeResponse update(Long id, EmployeeUpdate dto);

    EmployeeResponse getById(Long id);

    PageResponse<EmployeeResponse> getAll(String search, EmployeePosition position, Boolean active, String linkedUser, LocalDateTime availableFrom, LocalDateTime availableTo, Pageable pageable);

    void delete(Long id);

    List<TaskResponse> getTasksByEmployeeId(Long id);

    List<ShiftResponse> getShiftsByEmployeeId(Long id);

    void terminateEmployee(Long id);

    EmployeeResponse archiveEmployee(Long id);

    EmployeeResponse restoreEmployee(Long id);
}
