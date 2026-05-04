package rs.logistics.logistics_system.service.support;

import java.math.BigDecimal;

/**
 * Shared helper for query/input normalization used by service-layer filters.
 * Keeps controllers thin and avoids every service carrying its own trim/ALL/id parsing helpers.
 */
public final class QueryParameterNormalizer {

    private QueryParameterNormalizer() {
    }

    public static String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    public static String trimToNullOrAll(String value) {
        String normalized = trimToNull(value);
        if (normalized == null || "ALL".equalsIgnoreCase(normalized)) {
            return null;
        }
        return normalized;
    }

    public static String upperTrimToNullOrAll(String value) {
        String normalized = trimToNullOrAll(value);
        return normalized == null ? null : normalized.toUpperCase();
    }

    public static Long parseLongOrNull(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }

        try {
            return Long.valueOf(normalized);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    public static BigDecimal zeroIfNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
