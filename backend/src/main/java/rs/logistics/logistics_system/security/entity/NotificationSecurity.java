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
        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        return notificationRepository.findById(notificationId)
                .map(notification ->
                        authenticatedUserProvider.isCurrentUserInAuthenticatedCompany(notification.getUser())
                )
                .orElse(false);
    }
}
