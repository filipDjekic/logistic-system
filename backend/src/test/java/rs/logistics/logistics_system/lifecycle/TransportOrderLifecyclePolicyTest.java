package rs.logistics.logistics_system.lifecycle;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.testsupport.TestSecurity;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class TransportOrderLifecyclePolicyTest {

    @Mock
    private AuthenticatedUserProvider authenticatedUserProvider;

    private LifecycleTransitionEngine lifecycleTransitionEngine;

    @BeforeEach
    void setUp() {
        LifecyclePolicyRegistry policyRegistry = new LifecyclePolicyRegistry(new AppProperties());
        lifecycleTransitionEngine = new LifecycleTransitionEngine(policyRegistry, authenticatedUserProvider);
        lenient().when(authenticatedUserProvider.hasAuthenticatedUserContext()).thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        TestSecurity.clear();
    }

    @Test
    void dispatcherCanPerformValidTransportTransitionFromDraftToAssigned() {
        TestSecurity.authenticate("dispatcher@test.local", "DISPATCHER");

        assertDoesNotThrow(() -> lifecycleTransitionEngine.validate(
                LifecycleEntityType.TRANSPORT_ORDER,
                1L,
                TransportOrderStatus.class,
                TransportOrderStatus.DRAFT,
                TransportOrderStatus.ASSIGNED,
                "Dispatch approved",
                3L,
                3L
        ));
    }

    @Test
    void invalidTransportTransitionFromDraftToDeliveredIsRejected() {
        TestSecurity.authenticate("dispatcher@test.local", "DISPATCHER");

        assertThrows(BadRequestException.class, () -> lifecycleTransitionEngine.validate(
                LifecycleEntityType.TRANSPORT_ORDER,
                1L,
                TransportOrderStatus.class,
                TransportOrderStatus.DRAFT,
                TransportOrderStatus.DELIVERED,
                "Skip workflow",
                3L,
                3L
        ));
    }

    @Test
    void roleWithoutPermissionCannotPerformTransportTransition() {
        TestSecurity.authenticate("worker@test.local", "WORKER");

        assertThrows(ForbiddenException.class, () -> lifecycleTransitionEngine.validate(
                LifecycleEntityType.TRANSPORT_ORDER,
                1L,
                TransportOrderStatus.class,
                TransportOrderStatus.DRAFT,
                TransportOrderStatus.ASSIGNED,
                "Worker should not dispatch transport",
                3L,
                3L
        ));
    }
}
