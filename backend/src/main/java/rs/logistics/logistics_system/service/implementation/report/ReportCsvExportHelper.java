package rs.logistics.logistics_system.service.implementation.report;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;

final class ReportCsvExportHelper {

    private ReportCsvExportHelper() {
    }

    static byte[] toCsvBytes(List<List<?>> rows) {
        StringBuilder csv = new StringBuilder("\uFEFF");
        for (List<?> row : rows) {
            for (int index = 0; index < row.size(); index++) {
                if (index > 0) {
                    csv.append(',');
                }
                csv.append(escape(row.get(index)));
            }
            csv.append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    static void addSectionTitle(List<List<?>> rows, String title) {
        if (!rows.isEmpty()) {
            rows.add(List.of());
        }
        rows.add(List.of(title));
    }

    static String format(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal.stripTrailingZeros().toPlainString();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime.toString();
        }
        if (value instanceof LocalDate localDate) {
            return localDate.toString();
        }
        return String.valueOf(value);
    }

    static void addMapRows(List<List<?>> rows, Map<String, Long> map, String keyHeader, String valueHeader) {
        rows.add(List.of(keyHeader, valueHeader));
        map.forEach((key, value) -> rows.add(List.of(key, value)));
    }

    static boolean hasItems(Collection<?> collection) {
        return collection != null && !collection.isEmpty();
    }

    private static String escape(Object rawValue) {
        String value = format(rawValue);
        boolean mustQuote = value.contains(",") || value.contains("\n") || value.contains("\r") || value.contains("\"");
        String escaped = value.replace("\"", "\"\"");
        return mustQuote ? "\"" + escaped + "\"" : escaped;
    }
}
