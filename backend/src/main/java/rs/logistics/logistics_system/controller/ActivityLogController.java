package rs.logistics.logistics_system.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;

@PreAuthorize("hasRole('OVERLORD')")
@RestController
@RequestMapping("/api/activity_logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogServiceDefinition activityLogService;

    @GetMapping("/{id}")
    public ResponseEntity<ActivityLogResponse> get(@PathVariable Long id){
        ActivityLogResponse response = activityLogService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ActivityLogResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ){
        PageResponse<ActivityLogResponse> response = activityLogService.search(search, action, entityName, userId, pageable);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }


    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "CSV") String format
    ) {
        PageResponse<ActivityLogResponse> response = activityLogService.search(
                search,
                action,
                entityName,
                userId,
                PageRequest.of(0, 5000, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        byte[] csv = activityLogsToCsv(response.content());
        return exportResponse(csv, "activity-log-audit-export", format);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<List<ActivityLogResponse>> getByUserId(@PathVariable Long id){
        List<ActivityLogResponse> response = activityLogService.getByUserId(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/action/{action}")
    public ResponseEntity<List<ActivityLogResponse>> getByUserIdAndAction(@PathVariable Long id, @PathVariable String action){
        List<ActivityLogResponse> response = activityLogService.getByAction(action, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/entity/{entityName}")
    public ResponseEntity<List<ActivityLogResponse>> getByEntityName(@PathVariable Long id, @PathVariable String entityName){
        List<ActivityLogResponse> response = activityLogService.getByEntityName(entityName, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/before")
    public ResponseEntity<List<ActivityLogResponse>> getByDateBefore(@PathVariable Long id, @RequestParam LocalDateTime date) {
        List<ActivityLogResponse> response = activityLogService.getBeforeDate(date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/after")
    public ResponseEntity<List<ActivityLogResponse>> getByDateAfter(@PathVariable Long id, @RequestParam LocalDateTime date) {
        List<ActivityLogResponse> response = activityLogService.getAfterDate(date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/between")
    public ResponseEntity<List<ActivityLogResponse>> getByDateBetween(@PathVariable Long id, @RequestParam LocalDateTime start, @RequestParam LocalDateTime end) {
        List<ActivityLogResponse> response = activityLogService.getBetweenDates(start, end, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    private byte[] activityLogsToCsv(List<ActivityLogResponse> rows) {
        StringBuilder csv = new StringBuilder("\uFEFF");
        csv.append("Id,Action,Entity,Entity Id,Description,User Id,Created At\n");
        for (ActivityLogResponse row : rows) {
            csv.append(escapeCsv(row.getId())).append(',')
                    .append(escapeCsv(row.getAction())).append(',')
                    .append(escapeCsv(row.getEntityName())).append(',')
                    .append(escapeCsv(row.getEntityId())).append(',')
                    .append(escapeCsv(row.getDescription())).append(',')
                    .append(escapeCsv(row.getUserId())).append(',')
                    .append(escapeCsv(row.getCreatedAt()))
                    .append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private ResponseEntity<byte[]> exportResponse(byte[] csv, String baseFileName, String format) {
        if ("XLSX".equalsIgnoreCase(format)) {
            byte[] workbook = toSpreadsheetXml(csv);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + baseFileName + ".xlsx\"")
                    .contentLength(workbook.length)
                    .body(workbook);
        }
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + baseFileName + ".csv\"")
                .contentLength(csv.length)
                .body(csv);
    }

    private byte[] toSpreadsheetXml(byte[] csv) {
        String csvText = new String(csv, StandardCharsets.UTF_8).replace("\uFEFF", "");
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\"?>");
        xml.append("<?mso-application progid=\"Excel.Sheet\"?>");
        xml.append("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" ");
        xml.append("xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\"><Worksheet ss:Name=\"Audit\"><Table>");
        for (String line : csvText.split("\\n")) {
            xml.append("<Row>");
            for (String cell : line.split(",", -1)) {
                xml.append("<Cell><Data ss:Type=\"String\">").append(escapeXml(cell.replace("\"", ""))).append("</Data></Cell>");
            }
            xml.append("</Row>");
        }
        xml.append("</Table></Worksheet></Workbook>");
        return xml.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String raw = String.valueOf(value);
        String escaped = raw.replace("\"", "\"\"");
        return raw.contains(",") || raw.contains("\n") || raw.contains("\r") || raw.contains("\"") ? "\"" + escaped + "\"" : escaped;
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
