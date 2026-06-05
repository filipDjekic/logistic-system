package rs.logistics.logistics_system.lifecycle;

import java.util.List;
import java.util.Set;

public record LifecycleTransitionPolicy<S extends Enum<S>>(
        LifecycleEntityType entityType,
        Class<S> statusType,
        java.util.Map<S, Set<S>> transitions,
        java.util.Map<S, Set<String>> roleMatrix,
        List<LifecycleTransitionHook<S>> hooks
) {
    public Set<S> allowedStatuses(S currentStatus) {
        return transitions.getOrDefault(currentStatus, Set.of());
    }

    public Set<String> allowedRoles(S targetStatus) {
        return roleMatrix.getOrDefault(targetStatus, Set.of());
    }
}
