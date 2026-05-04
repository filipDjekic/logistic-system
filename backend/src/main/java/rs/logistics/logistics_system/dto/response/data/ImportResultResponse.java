package rs.logistics.logistics_system.dto.response.data;

import java.util.List;

public record ImportResultResponse(
        String importType,
        String transactionMode,
        boolean success,
        int totalRows,
        int importedRows,
        int failedRows,
        List<ImportRowErrorResponse> errors
) {
}
