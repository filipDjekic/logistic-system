package rs.logistics.logistics_system.service.support;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.junit.jupiter.api.Test;

class CsvXlsxConverterTest {
    @Test
    void producesOoxmlPackageAndPreservesQuotedCsvCells() throws Exception {
        byte[] workbook = CsvXlsxConverter.convert(
                "name,description\r\nWidget,\"comma, quote \"\"and\"\" newline\nvalue\"\r\n"
                        .getBytes(StandardCharsets.UTF_8),
                "Report"
        );

        assertEquals('P', workbook[0]);
        assertEquals('K', workbook[1]);
        Map<String, String> entries = unzip(workbook);
        assertTrue(entries.containsKey("[Content_Types].xml"));
        assertTrue(entries.containsKey("xl/workbook.xml"));
        assertTrue(entries.get("xl/worksheets/sheet1.xml").contains(
                "comma, quote &quot;and&quot; newline\nvalue"
        ));
    }

    private Map<String, String> unzip(byte[] workbook) throws Exception {
        Map<String, String> entries = new HashMap<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(workbook), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                entries.put(entry.getName(), new String(zip.readAllBytes(), StandardCharsets.UTF_8));
            }
        }
        return entries;
    }
}
