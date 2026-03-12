package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;

import java.util.List;

public interface ShiftServiceDefinition {

    ShiftResponse create(ShiftCreate dto);

    ShiftResponse update(Long id, ShiftUpdate dto);

    ShiftResponse getById(Long id);

    List<ShiftResponse> getAll();

    void delete(Long id);
}
