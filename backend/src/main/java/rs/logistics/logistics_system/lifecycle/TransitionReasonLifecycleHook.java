package rs.logistics.logistics_system.lifecycle;

import rs.logistics.logistics_system.exception.BadRequestException;

public class TransitionReasonLifecycleHook<S extends Enum<S>> implements LifecycleTransitionHook<S> {
    @Override
    public void beforeTransition(LifecycleTransitionContext<S> context) {
        if (context.reason() != null && context.reason().length() > 500) {
            throw new BadRequestException("Transition reason must be at most 500 characters");
        }
    }
}
