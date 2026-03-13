package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.update.ActivityLogUpdate;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.mapper.ActivityLogMapper;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService implements ActivityLogServiceDefinition {

    private final ActivityLogRepository _activityLogRepository;
    private final UserRepository _userRepository;


    @Override
    public ActivityLogResponse create(ActivityLogCreate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));

        ActivityLog activityLog = ActivityLogMapper.toEntity(dto, user);
        ActivityLog saved = _activityLogRepository.save(activityLog);
        return ActivityLogMapper.toResponse(saved);
    }

    @Override
    public ActivityLogResponse update(Long id, ActivityLogUpdate dto) {
        User user  = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        ActivityLog activityLog = _activityLogRepository.findById(id).orElseThrow(() -> new RuntimeException("ActivityLog not found"));

        ActivityLogMapper.updateEntity(dto, user, activityLog);
        ActivityLog updated = _activityLogRepository.save(activityLog);
        return ActivityLogMapper.toResponse(updated);
    }

    @Override
    public ActivityLogResponse getById(Long id) {
        ActivityLog  activityLog = _activityLogRepository.findById(id).orElseThrow(() -> new RuntimeException("ActivityLog not found"));
        return ActivityLogMapper.toResponse(activityLog);
    }

    @Override
    public List<ActivityLogResponse> getAll() {
        return _activityLogRepository.findAll().stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        ActivityLog  activityLog = _activityLogRepository.findById(id).orElseThrow(() -> new RuntimeException("ActivityLog not found"));
        _activityLogRepository.delete(activityLog);
    }
}
