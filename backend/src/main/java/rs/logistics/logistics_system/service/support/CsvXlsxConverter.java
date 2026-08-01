package rs.logistics.logistics_system.service.support;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public final class CsvXlsxConverter {
    private CsvXlsxConverter() {
    }

    public static byte[] convert(byte[] csv, String sheetName) {
        List<List<String>> rows = parseCsv(new String(csv, StandardCharsets.UTF_8).replace("\uFEFF", ""));
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
                write(zip, "[Content_Types].xml", contentTypes());
                write(zip, "_rels/.rels", packageRelationships());
                write(zip, "xl/workbook.xml", workbookXml(sanitizeSheetName(sheetName)));
                write(zip, "xl/_rels/workbook.xml.rels", workbookRelationships());
                write(zip, "xl/worksheets/sheet1.xml", worksheetXml(rows));
            }
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("XLSX export could not be generated", ex);
        }
    }

    private static void write(ZipOutputStream zip, String name, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private static String contentTypes() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
                + "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
                + "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
                + "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
                + "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
                + "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"
                + "</Types>";
    }

    private static String packageRelationships() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
                + "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
                + "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>"
                + "</Relationships>";
    }

    private static String workbookXml(String sheetName) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
                + "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" "
                + "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">"
                + "<sheets><sheet name=\"" + escapeXml(sheetName) + "\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>";
    }

    private static String workbookRelationships() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
                + "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
                + "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>"
                + "</Relationships>";
    }

    private static String worksheetXml(List<List<String>> rows) {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
                + "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
        for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
            xml.append("<row r=\"").append(rowIndex + 1).append("\">");
            List<String> row = rows.get(rowIndex);
            for (int columnIndex = 0; columnIndex < row.size(); columnIndex++) {
                String reference = columnName(columnIndex + 1) + (rowIndex + 1);
                xml.append("<c r=\"").append(reference).append("\" t=\"inlineStr\"><is><t xml:space=\"preserve\">")
                        .append(escapeXml(row.get(columnIndex))).append("</t></is></c>");
            }
            xml.append("</row>");
        }
        return xml.append("</sheetData></worksheet>").toString();
    }

    static List<List<String>> parseCsv(String value) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            if (current == '"') {
                if (quoted && index + 1 < value.length() && value.charAt(index + 1) == '"') {
                    cell.append('"');
                    index++;
                } else {
                    quoted = !quoted;
                }
            } else if (current == ',' && !quoted) {
                row.add(cell.toString());
                cell.setLength(0);
            } else if ((current == '\n' || current == '\r') && !quoted) {
                if (current == '\r' && index + 1 < value.length() && value.charAt(index + 1) == '\n') {
                    index++;
                }
                row.add(cell.toString());
                cell.setLength(0);
                rows.add(row);
                row = new ArrayList<>();
            } else {
                cell.append(current);
            }
        }
        if (cell.length() > 0 || !row.isEmpty()) {
            row.add(cell.toString());
            rows.add(row);
        }
        return rows;
    }

    private static String columnName(int column) {
        StringBuilder result = new StringBuilder();
        while (column > 0) {
            column--;
            result.append((char) ('A' + column % 26));
            column /= 26;
        }
        return result.reverse().toString();
    }

    private static String sanitizeSheetName(String value) {
        String sanitized = value == null ? "Report" : value.replaceAll("[\\\\/*?:\\[\\]]", "_").trim();
        if (sanitized.isEmpty()) {
            return "Report";
        }
        return sanitized.length() > 31 ? sanitized.substring(0, 31) : sanitized;
    }

    private static String escapeXml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }
}
