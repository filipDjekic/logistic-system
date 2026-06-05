package rs.logistics.logistics_system.lifecycle;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;

@Component
public class LifecyclePolicyRegistry {

    private final Map<LifecycleEntityType, LifecycleTransitionPolicy<?>> policies = new EnumMap<>(LifecycleEntityType.class);

    public LifecyclePolicyRegistry(AppProperties appProperties) {
        policies.put(LifecycleEntityType.TASK, new LifecycleTransitionPolicy<>(
                LifecycleEntityType.TASK,
                TaskStatus.class,
                toEnumTransitionMap(TaskStatus.class, appProperties.getStatusTransitions().getTask()),
                taskRoleMatrix(),
                List.of(new TransitionReasonLifecycleHook<>())
        ));
        policies.put(LifecycleEntityType.TRANSPORT_ORDER, new LifecycleTransitionPolicy<>(
                LifecycleEntityType.TRANSPORT_ORDER,
                TransportOrderStatus.class,
                toEnumTransitionMap(TransportOrderStatus.class, appProperties.getStatusTransitions().getTransportOrder()),
                transportRoleMatrix(),
                List.of(new TransitionReasonLifecycleHook<>())
        ));
        policies.put(LifecycleEntityType.VEHICLE, new LifecycleTransitionPolicy<>(
                LifecycleEntityType.VEHICLE,
                VehicleStatus.class,
                toEnumTransitionMap(VehicleStatus.class, appProperties.getStatusTransitions().getVehicle()),
                vehicleRoleMatrix(),
                List.of(new TransitionReasonLifecycleHook<>())
        ));
    }

    @SuppressWarnings("unchecked")
    public <S extends Enum<S>> LifecycleTransitionPolicy<S> getPolicy(LifecycleEntityType entityType, Class<S> statusType) {
        LifecycleTransitionPolicy<?> policy = policies.get(entityType);
        if (policy == null || !policy.statusType().equals(statusType)) {
            throw new IllegalArgumentException("Lifecycle policy is not registered for " + entityType);
        }
        return (LifecycleTransitionPolicy<S>) policy;
    }

    private static <S extends Enum<S>> Map<S, Set<S>> toEnumTransitionMap(Class<S> enumType, Map<String, List<String>> source) {
        Map<S, Set<S>> result = new LinkedHashMap<>();
        for (S status : enumType.getEnumConstants()) {
            List<String> names = source.getOrDefault(status.name(), List.of());
            Set<S> allowed = new LinkedHashSet<>();
            for (String name : names) {
                if (name != null && !name.isBlank()) {
                    allowed.add(Enum.valueOf(enumType, name.trim()));
                }
            }
            result.put(status, allowed);
        }
        return result;
    }

    private static Map<TaskStatus, Set<String>> taskRoleMatrix() {
        Map<TaskStatus, Set<String>> matrix = new EnumMap<>(TaskStatus.class);
        Set<String> managers = Set.of("OVERLORD", "COMPANY_ADMIN", "WAREHOUSE_MANAGER", "DISPATCHER");
        matrix.put(TaskStatus.OPEN, managers);
        matrix.put(TaskStatus.ASSIGNED, managers);
        matrix.put(TaskStatus.IN_PROGRESS, Set.of("OVERLORD", "COMPANY_ADMIN", "WAREHOUSE_MANAGER", "DISPATCHER", "DRIVER", "WORKER"));
        matrix.put(TaskStatus.BLOCKED, Set.of("OVERLORD", "COMPANY_ADMIN", "WAREHOUSE_MANAGER", "DISPATCHER", "DRIVER", "WORKER"));
        matrix.put(TaskStatus.COMPLETED, Set.of("OVERLORD", "COMPANY_ADMIN", "WAREHOUSE_MANAGER", "DISPATCHER", "DRIVER", "WORKER"));
        matrix.put(TaskStatus.CANCELLED, managers);
        return matrix;
    }

    private static Map<TransportOrderStatus, Set<String>> transportRoleMatrix() {
        Map<TransportOrderStatus, Set<String>> matrix = new EnumMap<>(TransportOrderStatus.class);
        Set<String> dispatch = Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER");
        Set<String> operational = Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER", "WAREHOUSE_MANAGER");
        matrix.put(TransportOrderStatus.ASSIGNED, dispatch);
        matrix.put(TransportOrderStatus.PICKING, operational);
        matrix.put(TransportOrderStatus.PACKING, operational);
        matrix.put(TransportOrderStatus.READY_FOR_LOADING, operational);
        matrix.put(TransportOrderStatus.LOADING, operational);
        matrix.put(TransportOrderStatus.IN_TRANSIT, Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER", "DRIVER"));
        matrix.put(TransportOrderStatus.DELIVERED, Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER", "DRIVER"));
        matrix.put(TransportOrderStatus.RETURNING, Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER", "DRIVER"));
        matrix.put(TransportOrderStatus.RESCHEDULED, dispatch);
        matrix.put(TransportOrderStatus.FAILED, dispatch);
        matrix.put(TransportOrderStatus.CANCELLED, dispatch);
        return matrix;
    }

    private static Map<VehicleStatus, Set<String>> vehicleRoleMatrix() {
        Map<VehicleStatus, Set<String>> matrix = new EnumMap<>(VehicleStatus.class);
        Set<String> fleet = Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER");
        matrix.put(VehicleStatus.AVAILABLE, fleet);
        matrix.put(VehicleStatus.RESERVED, fleet);
        matrix.put(VehicleStatus.IN_USE, fleet);
        matrix.put(VehicleStatus.MAINTENANCE, Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER", "WAREHOUSE_MANAGER"));
        matrix.put(VehicleStatus.OUT_OF_SERVICE, Set.of("OVERLORD", "COMPANY_ADMIN", "DISPATCHER"));
        return matrix;
    }
}
