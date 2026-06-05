package rs.logistics.logistics_system.lifecycle;

import java.util.Set;

public record LifecycleTransitionContext<S extends Enum<S>>(
        LifecycleEntityType entityType,
        Long entityId,
        S fromStatus,
        S toStatus,
        String reason,
        Long expectedVersion,
        Long currentVersion,
        Set<String> userRoles,
        Long userId
) {
}
