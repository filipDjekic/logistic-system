package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;

import java.util.List;

public interface EmployeeServiceDefinition {

    EmployeeResponse create(EmployeeCreate dto);

    EmployeeResponse update(Long id, EmployeeUpdate dto);

    EmployeeResponse getById(Long id);

    List<EmployeeResponse> getAll();

    void delete(Long id);

    List<TaskResponse> getTasksByEmployeeId(Long id);

    List<ShiftResponse> getShiftsByEmployeeId(Long id);

    void terminateEmployee(Long id);
}
