package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ActivityLogMapper;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService implements ActivityLogServiceDefinition {

    private final ActivityLogRepository _activityLogRepository;
    private final UserRepository _userRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public ActivityLogResponse getById(Long id) {
        ActivityLog activityLog = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("ActivityLog not found"))
                : _activityLogRepository.findByIdAndUser_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("ActivityLog not found"));

        return ActivityLogMapper.toResponse(activityLog);
    }

    @Override
    public List<ActivityLogResponse> getAll() {
        List<ActivityLog> logs = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findAll()
                : _activityLogRepository.findAllByUser_Company_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return logs.stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public PageResponse<ActivityLogResponse> search(String search, String action, String entityName, Long userId, Pageable pageable) {
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Page<ActivityLog> logs = _activityLogRepository.searchLogs(
                companyId,
                trimToNull(search),
                trimToNull(action),
                trimToNull(entityName),
                userId,
                pageable
        );

        List<ActivityLogResponse> content = logs.getContent()
                .stream()
                .map(ActivityLogMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.fromContent(content, logs);
    }

    @Override
    public List<ActivityLogResponse> getByUserId(Long id) {
        User user = getAccessibleUser(id);

        List<ActivityLog> logs = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findByUserId(user.getId())
                : _activityLogRepository.findByUserIdAndUser_Company_Id(user.getId(), authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return logs.stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ActivityLogResponse> getByAction(String action, Long userId) {
        User user = getAccessibleUser(userId);

        List<ActivityLog> logs = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findByActionAndUserId(action, user.getId())
                : _activityLogRepository.findByActionAndUserIdAndUser_Company_Id(
                        action,
                        user.getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return logs.stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ActivityLogResponse> getByEntityName(String entityName, Long userId) {
        User user = getAccessibleUser(userId);

        List<ActivityLog> logs = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findByEntityNameAndUserId(entityName, user.getId())
                : _activityLogRepository.findByEntityNameAndUserIdAndUser_Company_Id(
                        entityName,
                        user.getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return logs.stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ActivityLogResponse> getBetweenDates(LocalDateTime start, LocalDateTime end, Long userId) {
        User user = getAccessibleUser(userId);

        List<ActivityLog> logs = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findByCreatedAtBetweenAndUserId(start, end, user.getId())
                : _activityLogRepository.findByCreatedAtBetweenAndUserIdAndUser_Company_Id(
                        start,
                        end,
                        user.getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return logs.stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ActivityLogResponse> getBeforeDate(LocalDateTime date, Long userId) {
        User user = getAccessibleUser(userId);

        List<ActivityLog> logs = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findByCreatedAtBeforeAndUserId(date, user.getId())
                : _activityLogRepository.findByCreatedAtBeforeAndUserIdAndUser_Company_Id(
                        date,
                        user.getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return logs.stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ActivityLogResponse> getAfterDate(LocalDateTime date, Long userId) {
        User user = getAccessibleUser(userId);

        List<ActivityLog> logs = authenticatedUserProvider.isOverlord()
                ? _activityLogRepository.findByCreatedAtAfterAndUserId(date, user.getId())
                : _activityLogRepository.findByCreatedAtAfterAndUserIdAndUser_Company_Id(
                        date,
                        user.getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return logs.stream().map(ActivityLogMapper::toResponse).collect(Collectors.toList());
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private User getAccessibleUser(Long userId) {
        if (authenticatedUserProvider.isOverlord()) {
            return _userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        return _userRepository.findByIdAndCompany_Id(userId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}