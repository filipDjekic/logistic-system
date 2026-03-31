package rs.logistics.logistics_system.security.entity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

@Component("notificationSecurity")
@RequiredArgsConstructor
public class NotificationSecurity {

    private final NotificationRepository notificationRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public boolean isOwner(Long notificationId) {
        return notificationRepository.findById(notificationId).map(notification -> notification.getUser() != null && notification.getUser().getId().equals(authenticatedUserProvider.getAuthenticatedUserId())).orElse(false);
    }
}
