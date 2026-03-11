package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;

import java.util.List;

public interface EmployeeServiceDefinition {

    EmployeeResponse create(EmployeeCreate dto, User user);

    EmployeeResponse update(Long id, EmployeeUpdate dto, User user);

    EmployeeResponse getById(Long id);

    List<EmployeeResponse> getAll();

    void delete(Long id);
}
