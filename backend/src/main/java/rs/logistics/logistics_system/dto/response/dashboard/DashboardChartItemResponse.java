package rs.logistics.logistics_system.dto.response.dashboard;

import java.math.BigDecimal;

public record DashboardChartItemResponse(
        String key,
        String label,
        BigDecimal value,
        BigDecimal secondaryValue
) {
    public static DashboardChartItemResponse of(String key, String label, Number value) {
        return new DashboardChartItemResponse(key, label, toBigDecimal(value), null);
    }

    public static DashboardChartItemResponse of(String key, String label, Number value, Number secondaryValue) {
        return new DashboardChartItemResponse(key, label, toBigDecimal(value), toBigDecimal(secondaryValue));
    }

    private static BigDecimal toBigDecimal(Number value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        return BigDecimal.valueOf(value.doubleValue());
    }
}
