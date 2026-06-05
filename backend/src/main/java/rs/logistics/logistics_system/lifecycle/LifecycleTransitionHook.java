package rs.logistics.logistics_system.lifecycle;

public interface LifecycleTransitionHook<S extends Enum<S>> {
    default void beforeTransition(LifecycleTransitionContext<S> context) {
    }

    default void afterTransition(LifecycleTransitionContext<S> context) {
    }
}
