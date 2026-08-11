package rs.logistics.logistics_system.security;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

@Component
public class OverlordAccessPolicy {

    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private static final List<String> WRITE_ALLOWED_PATHS = List.of(
            "/api/companies",
            "/api/company-registration-requests",
            "/api/notifications"
    );

    public boolean canAccess(String method, String path) {
        return READ_METHODS.contains(method) || canWritePath(path);
    }

    private boolean canWritePath(String path) {
        return WRITE_ALLOWED_PATHS.stream()
                .anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }
}
