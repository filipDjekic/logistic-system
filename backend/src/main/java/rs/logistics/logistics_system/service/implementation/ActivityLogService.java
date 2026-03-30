package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.update.ActivityLogUpdate;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ActivityLogMapper;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService implements ActivityLogServiceDefinition {

    private final ActivityLogRepository _activityLogRepository;
    private final UserRepository _userRepository;

    @Override
    public ActivityLogResponse getById(Long id) {
        ActivityLog  activityLog = _activityLogRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("ActivityLog not found"));
        return ActivityLogMapper.toResponse(activityLog);
    }

    @Override
    public List<ActivityLogResponse> getAll() {
        return _activityLogRepository.findAll().stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ActivityLogResponse> getByUserId(Long id) {
        User user = _userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<ActivityLogResponse> activityLogResponses = new ArrayList<>();
        for (ActivityLog activityLog : _activityLogRepository.findByUserId(user.getId())) {
            ActivityLogResponse response = ActivityLogMapper.toResponse(activityLog);
            activityLogResponses.add(response);
        }

        return activityLogResponses;
    }

    @Override
    public List<ActivityLogResponse> getByAction(String action, Long userId) {
        User user = _userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<ActivityLogResponse> activityLogResponses = new ArrayList<>();
        for (ActivityLog activityLog : _activityLogRepository.findByActionAndUserId(action, user.getId())) {
            ActivityLogResponse response = ActivityLogMapper.toResponse(activityLog);
            activityLogResponses.add(response);
        }
        return activityLogResponses;
    }

    @Override
    public List<ActivityLogResponse> getByEntityName(String entityName, Long userId) {
        User user = _userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<ActivityLogResponse> activityLogResponses = new ArrayList<>();
        for (ActivityLog activityLog : _activityLogRepository.findByEntityNameAndUserId(entityName, user.getId())) {
            ActivityLogResponse response = ActivityLogMapper.toResponse(activityLog);
            activityLogResponses.add(response);
        }
        return activityLogResponses;
    }

    @Override
    public List<ActivityLogResponse> getBetweenDates(LocalDateTime start, LocalDateTime end, Long userId) {
        User user = _userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<ActivityLogResponse> activityLogResponses = new ArrayList<>();
        List<ActivityLog> activityLogs = _activityLogRepository.findByCreatedAtBetweenAndUserId(start, end, user.getId());
        for (ActivityLog activityLog : activityLogs) {
            ActivityLogResponse response = ActivityLogMapper.toResponse(activityLog);
            activityLogResponses.add(response);
        }
        return activityLogResponses;
    }

    @Override
    public List<ActivityLogResponse> getBeforeDate(LocalDateTime date, Long userId) {
        User user = _userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<ActivityLogResponse> activityLogResponses = new ArrayList<>();
        List<ActivityLog> activityLogs = _activityLogRepository.findByCreatedAtBeforeAndUserId(date, user.getId());
        for (ActivityLog activityLog : activityLogs) {
            ActivityLogResponse response = ActivityLogMapper.toResponse(activityLog);
            activityLogResponses.add(response);
        }
        return activityLogResponses;
    }

    @Override
    public List<ActivityLogResponse> getAfterDate(LocalDateTime date, Long userId) {
        User user = _userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<ActivityLogResponse> activityLogResponses = new ArrayList<>();
        List<ActivityLog> activityLogs = _activityLogRepository.findByCreatedAtAfterAndUserId(date, user.getId());
        for (ActivityLog activityLog : activityLogs) {
            ActivityLogResponse response = ActivityLogMapper.toResponse(activityLog);
            activityLogResponses.add(response);
        }
        return activityLogResponses;
    }
}
