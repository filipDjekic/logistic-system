package rs.logistics.logistics_system.testsupport;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
public abstract class ServiceTestSupport {

    @BeforeEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
}
