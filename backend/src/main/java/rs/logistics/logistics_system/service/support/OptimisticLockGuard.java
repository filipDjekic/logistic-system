package rs.logistics.logistics_system.service.support;

import java.util.Objects;

import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;

public final class OptimisticLockGuard {

    private OptimisticLockGuard() {
    }

    public static void requireExpectedVersion(Long expectedVersion, Long currentVersion, String resourceName) {
        if (expectedVersion == null) {
            throw new BadRequestException(resourceName + " version is required. Reload the record and try again.");
        }

        if (!Objects.equals(expectedVersion, currentVersion)) {
            throw new ConflictException(resourceName + " was changed by another user. Reload the record and try again.");
        }
    }
}
