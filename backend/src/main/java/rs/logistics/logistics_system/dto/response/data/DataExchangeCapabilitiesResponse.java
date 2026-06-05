package rs.logistics.logistics_system.dto.response.data;

import java.util.List;

public record DataExchangeCapabilitiesResponse(
        List<String> importTypes,
        List<String> exportTypes
) {
}
