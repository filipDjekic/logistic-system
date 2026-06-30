package rs.logistics.logistics_system.lifecycle;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import rs.logistics.logistics_system.enums.ShiftStatus;

public final class ShiftLifecyclePolicy {

    private ShiftLifecyclePolicy() {
    }

    public static LifecycleTransitionPolicy<ShiftStatus> create(
            Map<ShiftStatus, Set<ShiftStatus>> transitions
    ) {
        return new LifecycleTransitionPolicy<>(
                LifecycleEntityType.SHIFT,
                ShiftStatus.class,
                transitions,
                roleMatrix(),
                List.of(new TransitionReasonLifecycleHook<>())
        );
    }

    private static Map<ShiftStatus, Set<String>> roleMatrix() {
        Map<ShiftStatus, Set<String>> matrix = new EnumMap<>(ShiftStatus.class);
        Set<String> shiftManagers = Set.of("OVERLORD", "HR_MANAGER");

        matrix.put(ShiftStatus.PLANNED, shiftManagers);
        matrix.put(ShiftStatus.ACTIVE, Set.of("SYSTEM"));
        matrix.put(ShiftStatus.FINISHED, Set.of("SYSTEM"));
        matrix.put(ShiftStatus.CANCELLED, shiftManagers);

        return matrix;
    }
}
