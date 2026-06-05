package rs.logistics.logistics_system.dto.response.dashboard;

import java.util.List;

public record DashboardChartResponse(
        String key,
        String title,
        String type,
        List<DashboardChartItemResponse> items
) {
}
