package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.update.ActivityLogUpdate;

import java.util.List;

public interface ActivityLogServiceDefinition {

    ActivityLogResponse create(ActivityLogCreate dto);

    ActivityLogResponse update(Long id, ActivityLogUpdate dto);

    ActivityLogResponse getById(Long id);

    List<ActivityLogResponse> getAll();

    void delete(Long id);
}
