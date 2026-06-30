package rs.logistics.logistics_system.lifecycle;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

@Service
@RequiredArgsConstructor
public class LifecycleTransitionEngine {

    private final LifecyclePolicyRegistry policyRegistry;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public <S extends Enum<S>> LifecycleTransitionContext<S> validate(
            LifecycleEntityType entityType,
            Long entityId,
            Class<S> statusType,
            S currentStatus,
            S nextStatus,
            String reason,
            Long expectedVersion,
            Long currentVersion
    ) {
        if (currentStatus == null || nextStatus == null) {
            throw new BadRequestException("Lifecycle transition status is required");
        }
        if (currentStatus == nextStatus) {
            throw new BadRequestException("Entity already has selected status");
        }
        if (expectedVersion != null && currentVersion != null && !expectedVersion.equals(currentVersion)) {
            throw new BadRequestException("Entity was changed by another operation. Refresh details and retry transition.");
        }

        LifecycleTransitionPolicy<S> policy = policyRegistry.getPolicy(entityType, statusType);
        if (!policy.allowedStatuses(currentStatus).contains(nextStatus)) {
            throw new BadRequestException(entityType + " status cannot be changed from " + currentStatus + " to " + nextStatus);
        }

        Set<String> roles = currentUserRoles();
        Set<String> allowedRoles = policy.allowedRoles(nextStatus);
        if (!allowedRoles.isEmpty() && roles.stream().noneMatch(allowedRoles::contains)) {
            throw new ForbiddenException("Current role cannot perform " + entityType + " transition to " + nextStatus);
        }

        LifecycleTransitionContext<S> context = new LifecycleTransitionContext<>(
                entityType,
                entityId,
                currentStatus,
                nextStatus,
                reason,
                expectedVersion,
                currentVersion,
                roles,
                authenticatedUserProvider.hasAuthenticatedUserContext() ? authenticatedUserProvider.getAuthenticatedUserId() : null
        );
        policy.hooks().forEach(hook -> hook.beforeTransition(context));
        return context;
    }

    public <S extends Enum<S>> LifecycleTransitionContext<S> validateSystem(
            LifecycleEntityType entityType,
            Long entityId,
            Class<S> statusType,
            S currentStatus,
            S nextStatus,
            String reason,
            Long currentVersion
    ) {
        if (currentStatus == null || nextStatus == null) {
            throw new BadRequestException("Lifecycle transition status is required");
        }
        if (currentStatus == nextStatus) {
            throw new BadRequestException("Entity already has selected status");
        }

        LifecycleTransitionPolicy<S> policy = policyRegistry.getPolicy(entityType, statusType);
        if (!policy.allowedStatuses(currentStatus).contains(nextStatus)) {
            throw new BadRequestException(entityType + " status cannot be changed from " + currentStatus + " to " + nextStatus);
        }

        LifecycleTransitionContext<S> context = new LifecycleTransitionContext<>(
                entityType,
                entityId,
                currentStatus,
                nextStatus,
                reason,
                null,
                currentVersion,
                Set.of("SYSTEM"),
                authenticatedUserProvider.hasAuthenticatedUserContext() ? authenticatedUserProvider.getAuthenticatedUserId() : null
        );
        policy.hooks().forEach(hook -> hook.beforeTransition(context));
        return context;
    }

    public <S extends Enum<S>> void afterTransition(LifecycleTransitionContext<S> context, Class<S> statusType) {
        LifecycleTransitionPolicy<S> policy = policyRegistry.getPolicy(context.entityType(), statusType);
        policy.hooks().forEach(hook -> hook.afterTransition(context));
    }

    public <S extends Enum<S>> Set<S> allowedStatuses(LifecycleEntityType entityType, Class<S> statusType, S currentStatus) {
        if (currentStatus == null) {
            return Set.of();
        }
        LifecycleTransitionPolicy<S> policy = policyRegistry.getPolicy(entityType, statusType);
        return policy.allowedStatuses(currentStatus);
    }

    public <S extends Enum<S>> Set<S> allowedStatusesForCurrentUser(LifecycleEntityType entityType, Class<S> statusType, S currentStatus) {
        if (currentStatus == null) {
            return Set.of();
        }
        LifecycleTransitionPolicy<S> policy = policyRegistry.getPolicy(entityType, statusType);
        Set<String> roles = currentUserRoles();
        return policy.allowedStatuses(currentStatus).stream()
                .filter(status -> {
                    Set<String> allowedRoles = policy.allowedRoles(status);
                    return allowedRoles.isEmpty() || roles.stream().anyMatch(allowedRoles::contains);
                })
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    public <S extends Enum<S>> boolean isTransitionAllowed(
            LifecycleEntityType entityType,
            Class<S> statusType,
            S currentStatus,
            S nextStatus
    ) {
        if (currentStatus == null || nextStatus == null) {
            return false;
        }
        return allowedStatuses(entityType, statusType, currentStatus).contains(nextStatus);
    }

    public <S extends Enum<S>> void requireTransitionAllowed(
            LifecycleEntityType entityType,
            Class<S> statusType,
            S currentStatus,
            S nextStatus,
            String message
    ) {
        if (!isTransitionAllowed(entityType, statusType, currentStatus, nextStatus)) {
            throw new BadRequestException(message);
        }
    }

    private Set<String> currentUserRoles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Set.of();
        }
        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replaceFirst("^ROLE_", ""))
                .collect(Collectors.toSet());
    }
}
