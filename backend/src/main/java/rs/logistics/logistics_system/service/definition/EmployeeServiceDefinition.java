package rs.logistics.logistics_system.service.definition;

import java.util.List;

import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.create.EmployeeWithUserCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;

public interface EmployeeServiceDefinition {

    EmployeeResponse create(EmployeeCreate dto);

    EmployeeResponse createWithUser(EmployeeWithUserCreate dto);

    EmployeeResponse update(Long id, EmployeeUpdate dto);

    EmployeeResponse getById(Long id);

    List<EmployeeResponse> getAll();

    void delete(Long id);

    List<TaskResponse> getTasksByEmployeeId(Long id);

    List<ShiftResponse> getShiftsByEmployeeId(Long id);

    void terminateEmployee(Long id);
}