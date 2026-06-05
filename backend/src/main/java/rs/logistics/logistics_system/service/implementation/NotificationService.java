package rs.logistics.logistics_system.service.implementation;

import java.util.List;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationPageResponse;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSourceType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.NotificationMapper;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.support.PageRequestSanitizer;
import rs.logistics.logistics_system.service.realtime.NotificationSseService;

@Service
@RequiredArgsConstructor
public class NotificationService implements NotificationServiceDefinition {

    private final NotificationRepository _notificationRepository;
    private final UserRepository _userRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final NotificationSseService notificationSseService;

    @Override
    @Transactional
    public NotificationResponse create(NotificationCreate dto) {
        User user = getAccessibleUserForNotificationTarget(dto.getUserId());

        if (user.getStatus() == null) {
            throw new BadRequestException("User status is invalid");
        }

        return createOperationalNotification(
                user.getId(),
                dto.getTitle(),
                dto.getMessage(),
                dto.getType(),
                dto.getSeverity(),
                dto.getCategory(),
                dto.getSourceType(),
                dto.getSourceId(),
                dto.getDedupKey()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getById(Long id) {
        Notification notification = getAccessibleNotification(id);
        return NotificationMapper.toResponse(notification);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Notification notification = getAccessibleNotification(id);
        _notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = getAccessibleNotification(id);
        notification.markAsRead();
        Notification saved = _notificationRepository.save(notification);
        NotificationResponse response = NotificationMapper.toResponse(saved);
        publishAfterCommit(() -> notificationSseService.publishUpdated(notification.getUser().getId(), response));
        return response;
    }

    @Override
    @Transactional
    public NotificationResponse acknowledge(Long id) {
        Notification notification = getAccessibleNotification(id);
        notification.acknowledge();
        Notification saved = _notificationRepository.save(notification);
        NotificationResponse response = NotificationMapper.toResponse(saved);
        publishAfterCommit(() -> notificationSseService.publishUpdated(notification.getUser().getId(), response));
        return response;
    }

    @Override
    @Transactional
    public NotificationResponse resolve(Long id) {
        Notification notification = getAccessibleNotification(id);
        notification.resolve();
        Notification saved = _notificationRepository.save(notification);
        NotificationResponse response = NotificationMapper.toResponse(saved);
        publishAfterCommit(() -> notificationSseService.publishUpdated(notification.getUser().getId(), response));
        return response;
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        validateUserAccess(userId);
        _notificationRepository.markAllAsRead(userId, NotificationStatus.READ);
        publishAfterCommit(() -> notificationSseService.publishBulkUpdated(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getByUser(Long userId, int page, int size) {
        return getByUser(userId, null, null, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getByUser(Long userId, NotificationStatus status, NotificationType type, int page, int size) {
        return getByUser(userId, status, type, null, null, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getByUser(Long userId, NotificationStatus status, NotificationType type, NotificationSeverity severity, NotificationCategory category, int page, int size) {
        validateUserAccess(userId);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Pageable pageable = PageRequestSanitizer.sanitize(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notificationPage = _notificationRepository.searchForUser(
                userId,
                companyId,
                status,
                type,
                severity,
                category,
                pageable
        );

        long unreadCount = companyId == null
                ? _notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD)
                : _notificationRepository.countByUserIdAndStatusAndUser_Company_Id(userId, NotificationStatus.UNREAD, companyId);

        long criticalUnreadCount = companyId == null
                ? _notificationRepository.countByUserIdAndStatusAndSeverity(userId, NotificationStatus.UNREAD, NotificationSeverity.CRITICAL)
                : _notificationRepository.countByUserIdAndStatusAndSeverityAndUser_Company_Id(userId, NotificationStatus.UNREAD, NotificationSeverity.CRITICAL, companyId);

        long warningUnreadCount = companyId == null
                ? _notificationRepository.countByUserIdAndStatusAndSeverity(userId, NotificationStatus.UNREAD, NotificationSeverity.WARNING)
                : _notificationRepository.countByUserIdAndStatusAndSeverityAndUser_Company_Id(userId, NotificationStatus.UNREAD, NotificationSeverity.WARNING, companyId);

        List<NotificationResponse> items = notificationPage.getContent()
                .stream()
                .map(NotificationMapper::toResponse)
                .toList();

        return new NotificationPageResponse(
                items,
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                notificationPage.isLast(),
                unreadCount,
                criticalUnreadCount,
                warningUnreadCount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getByUserAndStatus(Long userId, NotificationStatus status, int page, int size) {
        return getByUser(userId, status, null, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        validateUserAccess(userId);
        return _notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    @Override
    @Transactional
    public NotificationResponse createSystemNotification(Long userId, String title, String message, NotificationType type) {
        getAccessibleUserForNotificationTarget(userId);

        return createOperationalNotification(
                userId,
                title,
                message,
                type,
                null,
                NotificationCategory.GENERAL,
                NotificationSourceType.SYSTEM,
                null,
                "SYSTEM:" + userId + ":" + title + ":" + message
        );
    }

    @Override
    @Transactional
    public NotificationResponse createInternalSystemNotification(Long userId, String title, String message, NotificationType type) {
        User user = _userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() == null) {
            throw new BadRequestException("User status is invalid");
        }

        return saveOperationalNotification(
                user,
                title,
                message,
                type,
                NotificationSeverity.INFO,
                NotificationCategory.GENERAL,
                NotificationSourceType.SYSTEM,
                null,
                "INTERNAL_SYSTEM:" + userId + ":" + title + ":" + message
        );
    }

    @Override
    @Transactional
    public NotificationResponse createOperationalNotification(Long userId,
                                                             String title,
                                                             String message,
                                                             NotificationType type,
                                                             NotificationSeverity severity,
                                                             NotificationCategory category,
                                                             NotificationSourceType sourceType,
                                                             Long sourceId,
                                                             String dedupKey) {
        User user = getOperationalNotificationTarget(userId);

        String normalizedDedupKey = hasText(dedupKey) ? dedupKey.trim() : null;
        String groupKey = normalizedDedupKey != null
                ? normalizedDedupKey
                : buildFallbackGroupKey(title, message, type, category, sourceType, sourceId);

        if (groupKey != null) {
            return _notificationRepository.findFirstByUserIdAndGroupKeyAndStatusOrderByCreatedAtDesc(userId, groupKey, NotificationStatus.UNREAD)
                    .map(existing -> {
                        existing.registerGroupedOccurrence(title, message);
                        Notification saved = _notificationRepository.save(existing);
                        NotificationResponse response = NotificationMapper.toResponse(saved);
                        publishAfterCommit(() -> notificationSseService.publishUpdated(userId, response));
                        return response;
                    })
                    .orElseGet(() -> saveOperationalNotification(user, title, message, type, severity, category, sourceType, sourceId, groupKey));
        }

        boolean duplicateUnreadExists = _notificationRepository.existsByUserIdAndTitleAndMessageAndTypeAndStatus(
                userId,
                title,
                message,
                type,
                NotificationStatus.UNREAD
        );

        if (duplicateUnreadExists) {
            Notification existing = _notificationRepository
                    .findByUserIdAndStatus(userId, NotificationStatus.UNREAD)
                    .stream()
                    .filter(n -> title.equals(n.getTitle())
                            && message.equals(n.getMessage())
                            && type == n.getType())
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Existing notification not found"));

            return NotificationMapper.toResponse(existing);
        }

        return saveOperationalNotification(user, title, message, type, severity, category, sourceType, sourceId, null);
    }

    private NotificationResponse saveOperationalNotification(User user,
                                                            String title,
                                                            String message,
                                                            NotificationType type,
                                                            NotificationSeverity severity,
                                                            NotificationCategory category,
                                                            NotificationSourceType sourceType,
                                                            Long sourceId,
                                                            String dedupKey) {
        Notification notification = new Notification(
                title,
                message,
                type,
                NotificationStatus.UNREAD,
                user,
                severity,
                category,
                sourceType,
                sourceId,
                dedupKey
        );
        if (notification.getSeverity() == NotificationSeverity.CRITICAL || notification.getSeverity() == NotificationSeverity.WARNING) {
            notification.markEscalated();
        }
        Notification saved = _notificationRepository.save(notification);
        NotificationResponse response = NotificationMapper.toResponse(saved);
        publishAfterCommit(() -> notificationSseService.publishCreated(user.getId(), response));
        return response;
    }

    private void publishAfterCommit(Runnable publisher) {
        if (publisher == null) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publisher.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                publisher.run();
            }
        });
    }

    private String buildFallbackGroupKey(String title,
                                         String message,
                                         NotificationType type,
                                         NotificationCategory category,
                                         NotificationSourceType sourceType,
                                         Long sourceId) {
        if (sourceType != null && sourceId != null) {
            return sourceType + ":" + sourceId + ":" + (category != null ? category : NotificationCategory.GENERAL) + ":" + type;
        }
        if (hasText(title) && hasText(message) && type != null) {
            return "TEXT:" + type + ":" + title.trim() + ":" + message.trim();
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private User getAccessibleUserForNotificationTarget(Long userId) {
        if (authenticatedUserProvider.isOverlord()) {
            return _userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        return _userRepository.findByIdAndCompany_Id(userId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Notification getAccessibleNotification(Long notificationId) {
        if (authenticatedUserProvider.isOverlord()) {
            return _notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        }

        if (authenticatedUserProvider.isCompanyAdmin()) {
            return _notificationRepository.findByIdAndUser_Company_Id(
                            notificationId,
                            authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                    )
                    .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        }

        Long authenticatedUserId = authenticatedUserProvider.getAuthenticatedUserId();

        return _notificationRepository.findByUserIdAndId(authenticatedUserId, notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }

    private void validateUserAccess(Long userId) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        if (authenticatedUserProvider.isCompanyAdmin()) {
            getAccessibleUserForNotificationTarget(userId);
            return;
        }

        if (!authenticatedUserProvider.isSelf(userId)) {
            throw new ForbiddenException("You do not have permission to access notifications for this user");
        }
    }

    private User getOperationalNotificationTarget(Long targetUserId) {
        if (targetUserId == null) {
            throw new BadRequestException("Notification target user id is required");
        }

        User targetUser = _userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification target user is not found"));

        if (!authenticatedUserProvider.hasAuthenticatedUserContext()) {
            return targetUser;
        }

        if (authenticatedUserProvider.isOverlord()) {
            return targetUser;
        }

        Long authenticatedCompanyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        if (targetUser.getCompany() == null
                || !Objects.equals(targetUser.getCompany().getId(), authenticatedCompanyId)) {
            throw new ForbiddenException("You cannot create notification for user from another company");
        }

        return targetUser;
    }
}