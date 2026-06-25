package rs.logistics.logistics_system.service.support;

import org.junit.jupiter.api.Test;
import rs.logistics.logistics_system.exception.ConflictException;

import static org.junit.jupiter.api.Assertions.assertThrows;

class EmployeeProfileChangeRequestRateLimiterTest {

    @Test
    void checkCreateAllowedRejectsMoreThanFiveRequestsPerUserWindow() {
        EmployeeProfileChangeRequestRateLimiter limiter = new EmployeeProfileChangeRequestRateLimiter();

        for (int i = 0; i < 5; i++) {
            limiter.checkCreateAllowed(10L);
        }

        assertThrows(ConflictException.class, () -> limiter.checkCreateAllowed(10L));
    }

    @Test
    void checkCreateAllowedTracksUsersSeparately() {
        EmployeeProfileChangeRequestRateLimiter limiter = new EmployeeProfileChangeRequestRateLimiter();

        for (int i = 0; i < 5; i++) {
            limiter.checkCreateAllowed(10L);
        }

        limiter.checkCreateAllowed(11L);
    }
}
