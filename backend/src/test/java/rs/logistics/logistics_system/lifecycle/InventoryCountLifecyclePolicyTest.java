package rs.logistics.logistics_system.lifecycle;

import org.junit.jupiter.api.Test;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InventoryCountLifecyclePolicyTest {

    @Test
    void defaultInventoryCountTransitionsCoverCompleteWorkflow() {
        AppProperties properties = new AppProperties();

        assertEquals(List.of("OPEN", "CANCELLED"), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.DRAFT));
        assertEquals(List.of("COUNTING", "CANCELLED"), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.OPEN));
        assertEquals(List.of("REVIEW", "CANCELLED"), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.COUNTING));
        assertEquals(List.of("APPROVED", "REJECTED", "COUNTING", "CANCELLED"), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.REVIEW));
        assertEquals(List.of("ADJUSTMENTS_CREATED", "CANCELLED"), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.APPROVED));
        assertEquals(List.of("CLOSED"), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.ADJUSTMENTS_CREATED));
        assertEquals(List.of(), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.CLOSED));
        assertEquals(List.of(), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.REJECTED));
        assertEquals(List.of(), properties.allowedInventoryCountStatusTransitions(InventoryCountSessionStatus.CANCELLED));
    }

    @Test
    void policySeparatesCounterAndManagerRoles() {
        LifecycleTransitionPolicy<InventoryCountSessionStatus> policy = InventoryCountLifecyclePolicy.create(defaultTransitions());

        assertTrue(policy.allowedRoles(InventoryCountSessionStatus.COUNTING).contains("WORKER"));
        assertTrue(policy.allowedRoles(InventoryCountSessionStatus.REVIEW).contains("WAREHOUSE_MANAGER"));
        assertTrue(policy.allowedRoles(InventoryCountSessionStatus.APPROVED).contains("COMPANY_ADMIN"));
        assertTrue(policy.allowedRoles(InventoryCountSessionStatus.CLOSED).contains("OVERLORD"));
    }

    private Map<InventoryCountSessionStatus, Set<InventoryCountSessionStatus>> defaultTransitions() {
        Map<InventoryCountSessionStatus, Set<InventoryCountSessionStatus>> transitions = new LinkedHashMap<>();
        transitions.put(InventoryCountSessionStatus.DRAFT, ordered(InventoryCountSessionStatus.OPEN, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.OPEN, ordered(InventoryCountSessionStatus.COUNTING, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.COUNTING, ordered(InventoryCountSessionStatus.REVIEW, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.REVIEW, ordered(InventoryCountSessionStatus.APPROVED, InventoryCountSessionStatus.REJECTED, InventoryCountSessionStatus.COUNTING, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.APPROVED, ordered(InventoryCountSessionStatus.ADJUSTMENTS_CREATED, InventoryCountSessionStatus.CANCELLED));
        transitions.put(InventoryCountSessionStatus.ADJUSTMENTS_CREATED, ordered(InventoryCountSessionStatus.CLOSED));
        transitions.put(InventoryCountSessionStatus.CLOSED, Set.of());
        transitions.put(InventoryCountSessionStatus.REJECTED, Set.of());
        transitions.put(InventoryCountSessionStatus.CANCELLED, Set.of());
        return transitions;
    }

    @SafeVarargs
    private final <S extends Enum<S>> Set<S> ordered(S... values) {
        return new LinkedHashSet<>(List.of(values));
    }
}
