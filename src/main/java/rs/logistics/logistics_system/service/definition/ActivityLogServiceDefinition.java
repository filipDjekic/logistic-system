package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.update.ActivityLogUpdate;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogServiceDefinition {

    ActivityLogResponse create(ActivityLogCreate dto);

    ActivityLogResponse update(Long id, ActivityLogUpdate dto);

    ActivityLogResponse getById(Long id);

    List<ActivityLogResponse> getAll();

    void delete(Long id);

    List<ActivityLogResponse> getByUserId(Long id);

    List<ActivityLogResponse> getByAction(String action, Long userId);

    List<ActivityLogResponse> getByEntityName(String entityName, Long userId);

    List<ActivityLogResponse> getBetweenDates(LocalDateTime start, LocalDateTime end, Long userId);

    List<ActivityLogResponse> getBeforeDate(LocalDateTime date, Long userId);

    List<ActivityLogResponse> getAfterDate(LocalDateTime date, Long userId);
}
