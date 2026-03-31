package rs.logistics.logistics_system.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class AuthenticatedUserProvider {

    private final UserRepository userRepository;

    public User getAuthenticatedUser() {
        Authentication  authentication = SecurityContextHolder.getContext().getAuthentication();

        if(authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new ResourceNotFoundException("Authenticated user is not found");
        }

        String principal = authentication.getName();

        return userRepository.findByEmail(principal).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public Long getAuthenticatedUserId() {
        return getAuthenticatedUser().getId();
    }

    public boolean isSelf(Long userId) {
        return getAuthenticatedUserId().equals(userId);
    }
}
