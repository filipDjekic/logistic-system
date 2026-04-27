package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogServiceDefinition {

    ActivityLogResponse getById(Long id);

    List<ActivityLogResponse> getAll();

    PageResponse<ActivityLogResponse> search(String search, String action, String entityName, Long userId, Pageable pageable);

    List<ActivityLogResponse> getByUserId(Long id);

    List<ActivityLogResponse> getByAction(String action, Long userId);

    List<ActivityLogResponse> getByEntityName(String entityName, Long userId);

    List<ActivityLogResponse> getBetweenDates(LocalDateTime start, LocalDateTime end, Long userId);

    List<ActivityLogResponse> getBeforeDate(LocalDateTime date, Long userId);

    List<ActivityLogResponse> getAfterDate(LocalDateTime date, Long userId);
}
