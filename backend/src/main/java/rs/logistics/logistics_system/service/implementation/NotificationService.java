package rs.logistics.logistics_system.service.implementation;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationPageResponse;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.NotificationMapper;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;

@Service
@RequiredArgsConstructor
public class NotificationService implements NotificationServiceDefinition {

    private final NotificationRepository _notificationRepository;
    private final UserRepository _userRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public NotificationResponse create(NotificationCreate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!authenticatedUserProvider.isOverlord()) {
            authenticatedUserProvider.ensureCompanyAccess(
                    user.getCompany() != null ? user.getCompany().getId() : null
            );
        }

        if (user.getStatus() == null) {
            throw new BadRequestException("User status is invalid");
        }

        Notification notification = NotificationMapper.toEntity(dto, user);
        Notification saved = _notificationRepository.save(notification);
        return NotificationMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getById(Long id) {
        Notification notification = getAccessibleNotification(id);
        return NotificationMapper.toResponse(notification);
    }

    @Override
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
        return NotificationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        validateUserAccess(userId);
        _notificationRepository.markAllAsRead(userId, NotificationStatus.READ);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getByUser(Long userId, int page, int size) {
        validateUserAccess(userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage;
        long unreadCount;

        if (authenticatedUserProvider.isOverlord()) {
            notificationPage = _notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
            unreadCount = _notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        } else if (authenticatedUserProvider.isCompanyAdmin()) {
            Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
            notificationPage = _notificationRepository.findByUserIdAndUser_Company_IdOrderByCreatedAtDesc(userId, companyId, pageable);
            unreadCount = _notificationRepository.countByUserIdAndStatusAndUser_Company_Id(userId, NotificationStatus.UNREAD, companyId);
        } else {
            notificationPage = _notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
            unreadCount = _notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        }

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
                unreadCount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getByUserAndStatus(Long userId, NotificationStatus status, int page, int size) {
        validateUserAccess(userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage;
        long unreadCount;

        if (authenticatedUserProvider.isOverlord()) {
            notificationPage = _notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status, pageable);
            unreadCount = _notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        } else if (authenticatedUserProvider.isCompanyAdmin()) {
            Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
            notificationPage = _notificationRepository.findByUserIdAndStatusAndUser_Company_IdOrderByCreatedAtDesc(
                    userId,
                    status,
                    companyId,
                    pageable
            );
            unreadCount = _notificationRepository.countByUserIdAndStatusAndUser_Company_Id(userId, NotificationStatus.UNREAD, companyId);
        } else {
            notificationPage = _notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status, pageable);
            unreadCount = _notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        }

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
                unreadCount
        );
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
        User user = _userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!authenticatedUserProvider.isOverlord()) {
            authenticatedUserProvider.ensureCompanyAccess(
                    user.getCompany() != null ? user.getCompany().getId() : null
            );
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

        Notification notification = new Notification(
                title,
                message,
                type,
                NotificationStatus.UNREAD,
                user
        );

        Notification saved = _notificationRepository.save(notification);
        return NotificationMapper.toResponse(saved);
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
            User targetUser = _userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            authenticatedUserProvider.ensureCompanyAccess(
                    targetUser.getCompany() != null ? targetUser.getCompany().getId() : null
            );
            return;
        }

        if (!authenticatedUserProvider.isSelf(userId)) {
            throw new ForbiddenException("You do not have permission to access notifications for this user");
        }
    }
}