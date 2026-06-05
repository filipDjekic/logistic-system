package rs.logistics.logistics_system.service.implementation.dashboard;

import rs.logistics.logistics_system.dto.response.dashboard.DashboardAlertResponse;
import rs.logistics.logistics_system.dto.response.dashboard.DashboardChartItemResponse;
import rs.logistics.logistics_system.dto.response.dashboard.DashboardChartResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

final class DashboardResponseFactory {

    private DashboardResponseFactory() {
    }

    static DashboardChartResponse statusChart(String key, String title, Map<String, Long> values) {
        return new DashboardChartResponse(
                key,
                title,
                "STATUS_DONUT",
                values.entrySet().stream()
                        .map(entry -> DashboardChartItemResponse.of(entry.getKey(), humanize(entry.getKey()), entry.getValue()))
                        .toList()
        );
    }

    static DashboardChartResponse barChart(String key, String title, Map<String, Long> values) {
        return new DashboardChartResponse(
                key,
                title,
                "BAR",
                values.entrySet().stream()
                        .map(entry -> DashboardChartItemResponse.of(entry.getKey(), humanize(entry.getKey()), entry.getValue()))
                        .toList()
        );
    }

    static DashboardChartResponse singleValueChart(String key, String title, String label, Number value) {
        return new DashboardChartResponse(
                key,
                title,
                "SINGLE_VALUE",
                List.of(DashboardChartItemResponse.of(key, label, value))
        );
    }

    static DashboardChartResponse comparisonChart(String key, String title, String firstLabel, Number firstValue, String secondLabel, Number secondValue) {
        return new DashboardChartResponse(
                key,
                title,
                "COMPARISON_BAR",
                List.of(
                        DashboardChartItemResponse.of(firstLabel, firstLabel, firstValue),
                        DashboardChartItemResponse.of(secondLabel, secondLabel, secondValue)
                )
        );
    }

    static DashboardAlertResponse alert(String severity, String key, String title, String message, long count) {
        return new DashboardAlertResponse(severity, key, title, message, count);
    }

    static DashboardAlertResponse lowStockAlert(long count) {
        return alert(
                count > 0 ? "WARNING" : "SUCCESS",
                "LOW_STOCK",
                "Low stock",
                count > 0 ? "Inventory rows are at or below minimum stock level." : "No low stock inventory rows detected.",
                count
        );
    }

    static DashboardAlertResponse openTasksAlert(long count) {
        return alert(
                count > 0 ? "INFO" : "SUCCESS",
                "OPEN_TASKS",
                "Open tasks",
                count > 0 ? "Tasks still require operational follow-up." : "No open tasks detected.",
                count
        );
    }

    static DashboardAlertResponse activeTransportsAlert(long count) {
        return alert(
                count > 0 ? "INFO" : "SUCCESS",
                "ACTIVE_TRANSPORTS",
                "Active transports",
                count > 0 ? "Transport orders are currently assigned or in transit." : "No active transport orders detected.",
                count
        );
    }

    static BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String humanize(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown";
        }
        String lower = value.replace('_', ' ').toLowerCase();
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
