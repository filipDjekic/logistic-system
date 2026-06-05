package rs.logistics.logistics_system.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.create.WarehouseInventoryCreate;
import rs.logistics.logistics_system.dto.response.data.DataExchangeCapabilitiesResponse;
import rs.logistics.logistics_system.dto.response.data.ImportResultResponse;
import rs.logistics.logistics_system.dto.response.data.ImportRowErrorResponse;
import rs.logistics.logistics_system.dto.response.report.EmployeeTaskReportResponse;
import rs.logistics.logistics_system.dto.response.report.InventoryReportResponse;
import rs.logistics.logistics_system.dto.response.report.TransportReportResponse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.FuelType;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.ProductUnit;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.VehicleType;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.repository.TimezoneRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.EmployeeServiceDefinition;
import rs.logistics.logistics_system.service.definition.ProductServiceDefinition;
import rs.logistics.logistics_system.service.definition.VehicleServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseServiceDefinition;
import rs.logistics.logistics_system.service.definition.report.EmployeeTaskReportServiceDefinition;
import rs.logistics.logistics_system.service.definition.report.InventoryReportServiceDefinition;
import rs.logistics.logistics_system.service.definition.report.TransportReportServiceDefinition;
import rs.logistics.logistics_system.service.implementation.VehicleCatalogService;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataExchangeController {

    private static final String TRANSACTION_MODE = "ALL_OR_NOTHING";
    private static final long MAX_IMPORT_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final int MAX_IMPORT_ROWS = 5000;
    private static final int MAX_CSV_COLUMNS = 80;
    private static final String CSV_CONTENT_TYPE = "text/csv";

    private final ProductServiceDefinition productService;
    private final VehicleServiceDefinition vehicleService;
    private final WarehouseServiceDefinition warehouseService;
    private final WarehouseInventoryServiceDefinition warehouseInventoryService;
    private final EmployeeServiceDefinition employeeService;
    private final TransportReportServiceDefinition transportReportService;
    private final InventoryReportServiceDefinition inventoryReportService;
    private final EmployeeTaskReportServiceDefinition employeeTaskReportService;
    private final VehicleCatalogService vehicleCatalogService;
    private final TimezoneRepository timezoneRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final Validator validator;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/capabilities")
    public DataExchangeCapabilitiesResponse getCapabilities() {
        return new DataExchangeCapabilitiesResponse(resolveAllowedImportTypes(), resolveAllowedExportTypes());
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER')")
    @PostMapping(value = "/import/{type}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<ImportResultResponse> importCsv(
            @PathVariable String type,
            @RequestPart("file") MultipartFile file
    ) {
        String normalizedType = normalizeType(type);
        enforceImportTypePermission(normalizedType);

        return ResponseEntity.ok(switch (normalizedType) {
            case "products" -> importRows(normalizedType, file, this::parseProductRow, productService::create);
            case "vehicles" -> importRows(normalizedType, file, this::parseVehicleRow, vehicleService::create);
            case "warehouses" -> importRows(normalizedType, file, this::parseWarehouseRow, warehouseService::create);
            case "warehouse-inventory" -> importRows(normalizedType, file, this::parseWarehouseInventoryRow, warehouseInventoryService::create);
            case "employees" -> importRows(normalizedType, file, this::parseEmployeeRow, employeeService::create);
            default -> throw new BadRequestException("Unsupported import type: " + type);
        });
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping("/export/transport-report.csv")
    public ResponseEntity<byte[]> exportTransportReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) TransportOrderStatus status,
            @RequestParam(required = false) PriorityLevel priority,
            @RequestParam(required = false) Long sourceWarehouseId,
            @RequestParam(required = false) Long destinationWarehouseId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long assignedEmployeeId
    ) {
        TransportReportResponse report = transportReportService.getTransportReport(
                fromDate, toDate, status, priority, sourceWarehouseId, destinationWarehouseId, vehicleId, assignedEmployeeId
        );

        StringBuilder csv = new StringBuilder();
        appendRow(csv, "id", "orderNumber", "status", "priority", "totalWeight", "orderDate", "departureTime", "plannedArrivalTime", "actualArrivalTime", "sourceWarehouseId", "sourceWarehouseName", "destinationWarehouseId", "destinationWarehouseName", "vehicleId", "vehicleRegistrationNumber", "assignedEmployeeId", "assignedEmployeeName");
        for (TransportReportResponse.TransportReportRowResponse row : report.rows()) {
            appendRow(csv,
                    row.id(), row.orderNumber(), row.status(), row.priority(), row.totalWeight(), row.orderDate(), row.departureTime(), row.plannedArrivalTime(), row.actualArrivalTime(),
                    row.sourceWarehouseId(), row.sourceWarehouseName(), row.destinationWarehouseId(), row.destinationWarehouseName(), row.vehicleId(), row.vehicleRegistrationNumber(), row.assignedEmployeeId(), row.assignedEmployeeName()
            );
        }

        return csvResponse("transport-report.csv", csv.toString());
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping("/export/inventory-report.csv")
    public ResponseEntity<byte[]> exportInventoryReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockMovementType movementType
    ) {
        InventoryReportResponse report = inventoryReportService.getInventoryReport(fromDate, toDate, warehouseId, productId, movementType);

        StringBuilder csv = new StringBuilder();
        appendRow(csv, "warehouseId", "warehouseName", "productId", "productName", "sku", "unit", "quantity", "reservedQuantity", "availableQuantity", "minStockLevel", "lowStock", "lastUpdated");
        for (InventoryReportResponse.InventoryRowResponse row : report.inventoryRows()) {
            appendRow(csv,
                    row.warehouseId(), row.warehouseName(), row.productId(), row.productName(), row.sku(), row.unit(), row.quantity(), row.reservedQuantity(), row.availableQuantity(), row.minStockLevel(), row.lowStock(), row.lastUpdated()
            );
        }

        appendRow(csv);
        appendRow(csv, "stockMovementId", "movementType", "quantity", "reasonCode", "referenceType", "referenceId", "referenceNumber", "warehouseId", "warehouseName", "productId", "productName", "sku", "createdAt");
        for (InventoryReportResponse.StockMovementRowResponse row : report.movementRows()) {
            appendRow(csv,
                    row.id(), row.movementType(), row.quantity(), row.reasonCode(), row.referenceType(), row.referenceId(), row.referenceNumber(), row.warehouseId(), row.warehouseName(), row.productId(), row.productName(), row.sku(), row.createdAt()
            );
        }

        return csvResponse("inventory-report.csv", csv.toString());
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @GetMapping("/export/employee-task-report.csv")
    public ResponseEntity<byte[]> exportEmployeeTaskReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) EmployeePosition position,
            @RequestParam(required = false) TaskStatus taskStatus,
            @RequestParam(required = false) TaskPriority taskPriority
    ) {
        EmployeeTaskReportResponse report = employeeTaskReportService.getEmployeeTaskReport(fromDate, toDate, employeeId, position, taskStatus, taskPriority);

        StringBuilder csv = new StringBuilder();
        appendRow(csv, "employeeId", "employeeName", "email", "position", "active", "employmentDate", "userId", "tasksTotal", "completedTasks", "openTasks", "shiftsTotal");
        for (EmployeeTaskReportResponse.EmployeeTaskReportRowResponse row : report.employeeRows()) {
            appendRow(csv, row.employeeId(), row.employeeName(), row.email(), row.position(), row.active(), row.employmentDate(), row.userId(), row.tasksTotal(), row.completedTasks(), row.openTasks(), row.shiftsTotal());
        }

        appendRow(csv);
        appendRow(csv, "taskId", "title", "status", "priority", "dueDate", "createdAt", "assignedEmployeeId", "assignedEmployeeName", "assignedEmployeePosition", "transportOrderId", "stockMovementId");
        for (EmployeeTaskReportResponse.TaskReportRowResponse row : report.taskRows()) {
            appendRow(csv, row.taskId(), row.title(), row.status(), row.priority(), row.dueDate(), row.createdAt(), row.assignedEmployeeId(), row.assignedEmployeeName(), row.assignedEmployeePosition(), row.transportOrderId(), row.stockMovementId());
        }

        return csvResponse("employee-task-report.csv", csv.toString());
    }

    private List<String> resolveAllowedImportTypes() {
        if (authenticatedUserProvider.hasRole("OVERLORD") || authenticatedUserProvider.hasRole("COMPANY_ADMIN")) {
            return List.of("products", "vehicles", "warehouses", "warehouse-inventory", "employees");
        }

        if (authenticatedUserProvider.hasRole("HR_MANAGER")) {
            return List.of("employees");
        }

        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return List.of("products", "warehouses", "warehouse-inventory");
        }

        return List.of();
    }

    private List<String> resolveAllowedExportTypes() {
        if (authenticatedUserProvider.hasRole("OVERLORD") || authenticatedUserProvider.hasRole("COMPANY_ADMIN")) {
            return List.of("transport-report", "inventory-report", "employee-task-report");
        }

        if (authenticatedUserProvider.hasRole("HR_MANAGER")) {
            return List.of("employee-task-report");
        }

        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return List.of("transport-report", "inventory-report");
        }

        if (authenticatedUserProvider.hasRole("DISPATCHER")) {
            return List.of("transport-report");
        }

        return List.of();
    }

    private void enforceImportTypePermission(String type) {
        if (authenticatedUserProvider.hasRole("OVERLORD") || authenticatedUserProvider.hasRole("COMPANY_ADMIN")) {
            return;
        }

        if (authenticatedUserProvider.hasRole("HR_MANAGER")) {
            if ("employees".equals(type)) {
                return;
            }
            throw new ForbiddenException("HR_MANAGER can import only employees CSV data");
        }

        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            if (Set.of("products", "warehouses", "warehouse-inventory").contains(type)) {
                return;
            }
            throw new ForbiddenException("WAREHOUSE_MANAGER can import only products, warehouses and warehouse inventory CSV data");
        }

        throw new ForbiddenException("Current role is not allowed to import CSV data");
    }

    private <T> ImportResultResponse importRows(String type, MultipartFile file, Function<Map<String, String>, T> rowParser, Consumer<T> rowImporter) {
        validateImportFile(file);

        List<ParsedImportRow<T>> parsedRows = new ArrayList<>();
        List<ImportRowErrorResponse> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                throw new BadRequestException("CSV header row is required");
            }

            List<String> headers = parseCsvLine(stripBom(headerLine)).stream()
                    .map(DataExchangeController::normalizeHeader)
                    .toList();

            if (headers.size() > MAX_CSV_COLUMNS) {
                errors.add(new ImportRowErrorResponse(1, "header", null, "CSV has too many columns. Maximum allowed is " + MAX_CSV_COLUMNS));
            }

            validateHeaders(type, headers, errors);
            validateCompanyHeader(type, headers, errors);

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (lineNumber - 1 > MAX_IMPORT_ROWS) {
                    errors.add(new ImportRowErrorResponse(lineNumber, "row", null, "CSV import is limited to " + MAX_IMPORT_ROWS + " data rows per file"));
                    break;
                }

                if (line.trim().isEmpty()) {
                    continue;
                }

                List<String> values = parseCsvLine(line);
                if (values.size() > headers.size()) {
                    errors.add(new ImportRowErrorResponse(lineNumber, "row", line, "Row has more values than the CSV header"));
                    continue;
                }

                try {
                    Map<String, String> row = toRow(headers, values);
                    T payload = rowParser.apply(row);
                    enforceImportCompanyScope(type, payload);
                    List<ImportRowErrorResponse> dtoErrors = validateDto(lineNumber, payload);
                    if (dtoErrors.isEmpty()) {
                        parsedRows.add(new ParsedImportRow<>(lineNumber, payload));
                    } else {
                        errors.addAll(dtoErrors);
                    }
                } catch (CsvRowValidationException ex) {
                    errors.add(new ImportRowErrorResponse(lineNumber, ex.field(), ex.value(), ex.getMessage()));
                } catch (RuntimeException ex) {
                    errors.add(new ImportRowErrorResponse(lineNumber, "row", null, cleanErrorMessage(ex)));
                }
            }
        } catch (IOException ex) {
            throw new BadRequestException("CSV file could not be read");
        }

        int totalRows = parsedRows.size() + (int) errors.stream().filter(error -> error.line() > 1).count();

        if (totalRows == 0 && errors.isEmpty()) {
            errors.add(new ImportRowErrorResponse(1, "row", null, "CSV file must contain at least one data row"));
        }

        if (!errors.isEmpty()) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return new ImportResultResponse(type, TRANSACTION_MODE, false, totalRows, 0, Math.max(totalRows, errors.size()), errors);
        }

        int importedRows = 0;
        for (ParsedImportRow<T> parsedRow : parsedRows) {
            try {
                rowImporter.accept(parsedRow.payload());
                importedRows++;
            } catch (RuntimeException ex) {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                return new ImportResultResponse(
                        type,
                        TRANSACTION_MODE,
                        false,
                        totalRows,
                        0,
                        totalRows,
                        List.of(new ImportRowErrorResponse(parsedRow.lineNumber(), "row", null, cleanErrorMessage(ex)))
                );
            }
        }

        return new ImportResultResponse(type, TRANSACTION_MODE, true, totalRows, importedRows, 0, List.of());
    }

    private <T> List<ImportRowErrorResponse> validateDto(int lineNumber, T payload) {
        return validator.validate(payload).stream()
                .map(violation -> new ImportRowErrorResponse(
                        lineNumber,
                        violation.getPropertyPath().toString(),
                        invalidValue(violation),
                        violation.getMessage()
                ))
                .toList();
    }

    private static String invalidValue(ConstraintViolation<?> violation) {
        Object invalidValue = violation.getInvalidValue();
        return invalidValue == null ? null : String.valueOf(invalidValue);
    }

    private void validateCompanyHeader(String type, List<String> headers, List<ImportRowErrorResponse> errors) {
        if (!authenticatedUserProvider.isOverlord()) {
            return;
        }

        if (List.of("products", "vehicles", "warehouses", "employees").contains(type) && !headers.contains("companyid")) {
            errors.add(new ImportRowErrorResponse(1, "companyId", null, "OVERLORD CSV import requires companyId header"));
        }
    }

    private static void validateHeaders(String type, List<String> headers, List<ImportRowErrorResponse> errors) {
        Set<String> seenHeaders = new HashSet<>();
        for (String header : headers) {
            if (header.isBlank()) {
                errors.add(new ImportRowErrorResponse(1, "header", null, "CSV header cannot be blank"));
            } else if (!seenHeaders.add(header)) {
                errors.add(new ImportRowErrorResponse(1, header, null, "Duplicate CSV header: " + header));
            }
        }

        List<String> requiredHeaders = switch (type) {
            case "products" -> List.of("name", "sku", "unit", "price", "fragile", "weight");
            case "vehicles" -> List.of("registrationnumber", "brand", "model", "type", "capacity", "maxweight", "fueltype", "yearofproduction", "status");
            case "warehouses" -> List.of("name", "address", "cityid", "postalcode", "countryid", "capacity", "status", "employeeid");
            case "warehouse-inventory" -> List.of("warehouseid", "productid", "quantity", "minstocklevel");
            case "employees" -> List.of("firstname", "lastname", "jmbg", "phonenumber", "email", "position", "employmentdate", "salary");
            default -> List.of();
        };

        for (String requiredHeader : requiredHeaders) {
            if (!headers.contains(requiredHeader)) {
                errors.add(new ImportRowErrorResponse(1, requiredHeader, null, "Missing required CSV header: " + requiredHeader));
            }
        }
    }

    private ProductCreate parseProductRow(Map<String, String> row) {
        ProductCreate dto = new ProductCreate();
        dto.setName(required(row, "name"));
        dto.setDescription(optional(row, "description"));
        dto.setSku(required(row, "sku"));
        dto.setUnit(enumValue(ProductUnit.class, required(row, "unit"), "unit"));
        dto.setPrice(positiveDecimal(required(row, "price"), "price"));
        dto.setFragile(bool(required(row, "fragile"), "fragile"));
        dto.setWeight(positiveDecimal(required(row, "weight"), "weight"));
        dto.setCompanyId(optionalPositiveLong(row, "companyid"));
        return dto;
    }

    private VehicleCreate parseVehicleRow(Map<String, String> row) {
        VehicleCreate dto = new VehicleCreate();
        dto.setRegistrationNumber(required(row, "registrationnumber"));
        dto.setVehicleModelId(vehicleCatalogService.getOrCreateModel(required(row, "brand"), required(row, "model")).getId());
        dto.setType(enumValue(VehicleType.class, required(row, "type"), "type"));
        dto.setCapacity(positiveDecimal(required(row, "capacity"), "capacity"));
        dto.setMaxWeight(positiveDecimal(required(row, "maxweight"), "maxWeight"));
        dto.setMaxVolume(optionalPositiveDecimal(row, "maxvolume"));
        dto.setMaxItems(optionalPositiveInteger(row, "maxitems"));
        dto.setFuelType(enumValue(FuelType.class, required(row, "fueltype"), "fuelType"));
        dto.setYearOfProduction(minInteger(required(row, "yearofproduction"), "yearOfProduction", 1990));
        dto.setStatus(enumValue(VehicleStatus.class, required(row, "status"), "status"));
        dto.setCompanyId(optionalPositiveLong(row, "companyid"));
        return dto;
    }

    private WarehouseCreate parseWarehouseRow(Map<String, String> row) {
        return new WarehouseCreate(
                required(row, "name"),
                required(row, "address"),
                positiveLongValue(required(row, "cityid"), "cityId"),
                optional(row, "city"),
                required(row, "postalcode"),
                positiveLongValue(required(row, "countryid"), "countryId"),
                requiredTimezoneId(row),
                optionalDecimal(row, "latitude"),
                optionalDecimal(row, "longitude"),
                positiveDecimal(required(row, "capacity"), "capacity"),
                enumValue(WarehouseStatus.class, required(row, "status"), "status"),
                positiveLongValue(required(row, "employeeid"), "employeeId"),
                optionalPositiveLong(row, "companyid")
        );
    }

    private WarehouseInventoryCreate parseWarehouseInventoryRow(Map<String, String> row) {
        WarehouseInventoryCreate dto = new WarehouseInventoryCreate();
        dto.setWarehouseId(positiveLongValue(required(row, "warehouseid"), "warehouseId"));
        dto.setProductId(positiveLongValue(required(row, "productid"), "productId"));
        dto.setQuantity(nonNegativeDecimal(required(row, "quantity"), "quantity"));
        dto.setMinStockLevel(nonNegativeDecimal(required(row, "minstocklevel"), "minStockLevel"));
        return dto;
    }

    private EmployeeCreate parseEmployeeRow(Map<String, String> row) {
        return new EmployeeCreate(
                required(row, "firstname"),
                required(row, "lastname"),
                required(row, "jmbg"),
                required(row, "phonenumber"),
                required(row, "email"),
                optional(row, "address"),
                optionalPositiveLong(row, "cityid"),
                optional(row, "city"),
                optional(row, "postalcode"),
                optionalTimezoneId(row),
                optionalPositiveLong(row, "countryid"),
                optionalPositiveLong(row, "primarywarehouseid"),
                enumValue(EmployeePosition.class, required(row, "position"), "position"),
                localDate(required(row, "employmentdate"), "employmentDate"),
                positiveDecimal(required(row, "salary"), "salary"),
                optionalPositiveLong(row, "userid"),
                optionalPositiveLong(row, "companyid")
        );
    }

    private static ResponseEntity<byte[]> csvResponse(String fileName, String csv) {
        byte[] bytes = ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
                .contentLength(bytes.length)
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(bytes);
    }

    private static void appendRow(StringBuilder csv, Object... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(escapeCsv(values[i]));
        }
        csv.append('\n');
    }

    private static String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }

        String text = String.valueOf(value);
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }

        return text;
    }

    private static List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    quoted = !quoted;
                }
            } else if (c == ',' && !quoted) {
                values.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }

        values.add(current.toString().trim());
        return values;
    }

    private static Map<String, String> toRow(List<String> headers, List<String> values) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            row.put(headers.get(i), i < values.size() ? values.get(i) : "");
        }
        return row;
    }

    private static String normalizeType(String type) {
        return type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeHeader(String header) {
        return header == null ? "" : header.trim().replace("_", "").replace("-", "").toLowerCase(Locale.ROOT);
    }

    private static String stripBom(String value) {
        return value != null && value.startsWith("\uFEFF") ? value.substring(1) : value;
    }

    private static String required(Map<String, String> row, String key) {
        String value = row.get(key);
        if (value == null || value.trim().isEmpty()) {
            throw new CsvRowValidationException(key, null, "Missing required column: " + key);
        }
        return value.trim();
    }

    private static String optional(Map<String, String> row, String key) {
        String value = row.get(key);
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private static Long optionalPositiveLong(Map<String, String> row, String key) {
        String value = optional(row, key);
        return value == null ? null : positiveLongValue(value, key);
    }

    private static BigDecimal optionalPositiveDecimal(Map<String, String> row, String key) {
        String value = optional(row, key);
        return value == null ? null : positiveDecimal(value, key);
    }

    private static BigDecimal optionalDecimal(Map<String, String> row, String key) {
        String value = optional(row, key);
        return value == null ? null : decimal(value, key);
    }

    private static Integer optionalPositiveInteger(Map<String, String> row, String key) {
        String value = optional(row, key);
        if (value == null) {
            return null;
        }
        Integer parsed = integer(value, key);
        if (parsed <= 0) {
            throw new CsvRowValidationException(key, value, key + " must be greater than zero");
        }
        return parsed;
    }

    private static Long positiveLongValue(String value, String field) {
        Long parsed = longValue(value, field);
        if (parsed <= 0) {
            throw new CsvRowValidationException(field, value, field + " must be greater than zero");
        }
        return parsed;
    }

    private static Long longValue(String value, String field) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new CsvRowValidationException(field, value, field + " must be a valid long number");
        }
    }

    private static Integer minInteger(String value, String field, int minValue) {
        Integer parsed = integer(value, field);
        if (parsed < minValue) {
            throw new CsvRowValidationException(field, value, field + " must be greater than or equal to " + minValue);
        }
        return parsed;
    }

    private static Integer integer(String value, String field) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            throw new CsvRowValidationException(field, value, field + " must be a valid integer");
        }
    }

    private static BigDecimal positiveDecimal(String value, String field) {
        BigDecimal parsed = decimal(value, field);
        if (parsed.signum() <= 0) {
            throw new CsvRowValidationException(field, value, field + " must be greater than zero");
        }
        return parsed;
    }

    private static BigDecimal nonNegativeDecimal(String value, String field) {
        BigDecimal parsed = decimal(value, field);
        if (parsed.signum() < 0) {
            throw new CsvRowValidationException(field, value, field + " must be zero or greater");
        }
        return parsed;
    }

    private static BigDecimal decimal(String value, String field) {
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException ex) {
            throw new CsvRowValidationException(field, value, field + " must be a valid decimal number");
        }
    }

    private static LocalDate localDate(String value, String field) {
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new CsvRowValidationException(field, value, field + " must be a valid ISO date, for example 2026-05-01");
        }
    }

    private static Boolean bool(String value, String field) {
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if ("true".equals(normalized) || "1".equals(normalized) || "yes".equals(normalized)) {
            return true;
        }
        if ("false".equals(normalized) || "0".equals(normalized) || "no".equals(normalized)) {
            return false;
        }
        throw new CsvRowValidationException(field, value, field + " must be true or false");
    }

    private static void validateImportFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is required");
        }

        if (file.getSize() > MAX_IMPORT_FILE_SIZE_BYTES) {
            throw new BadRequestException("CSV file size must be 5 MB or less");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank() || !originalFileName.toLowerCase(Locale.ROOT).endsWith(".csv")) {
            throw new BadRequestException("Only .csv files are supported");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()
                && !CSV_CONTENT_TYPE.equalsIgnoreCase(contentType)
                && !"application/vnd.ms-excel".equalsIgnoreCase(contentType)) {
            throw new BadRequestException("Unsupported CSV content type");
        }
    }

    private static <T extends Enum<T>> T enumValue(Class<T> enumClass, String value, String field) {
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new CsvRowValidationException(field, value, field + " has unsupported value: " + value);
        }
    }

    private static String cleanErrorMessage(RuntimeException ex) {
        String message = ex.getMessage();
        return message == null || message.isBlank() ? "CSV row could not be imported" : message;
    }

    private record ParsedImportRow<T>(int lineNumber, T payload) {
    }

    private static class CsvRowValidationException extends RuntimeException {
        private final String field;
        private final String value;

        private CsvRowValidationException(String field, String value, String message) {
            super(message);
            this.field = field;
            this.value = value;
        }

        private String field() {
            return field;
        }

        private String value() {
            return value;
        }
    }

    private Long requiredTimezoneId(Map<String, String> row) {
        Long timezoneId = optionalTimezoneId(row);
        if (timezoneId == null) {
            throw new CsvRowValidationException("timezoneId", null, "Missing required column: timezoneId");
        }
        return timezoneId;
    }

    private Long optionalTimezoneId(Map<String, String> row) {
        Long timezoneId = optionalPositiveLong(row, "timezoneid");
        if (timezoneId != null) {
            return timezoneId;
        }

        String timezoneName = optional(row, "timezone");
        if (timezoneName == null) {
            return null;
        }

        return timezoneRepository.findByNameIgnoreCase(timezoneName)
                .orElseThrow(() -> new CsvRowValidationException("timezone", timezoneName, "Unknown timezone: " + timezoneName))
                .getId();
    }
    private <T> void enforceImportCompanyScope(String type, T payload) {
    if ("warehouse-inventory".equals(type)) {
        return;
    }

    Long payloadCompanyId = extractCompanyId(payload);

    if (authenticatedUserProvider.isOverlord()) {
        if (payloadCompanyId == null) {
            throw new CsvRowValidationException("companyId", null, "companyId is required for OVERLORD CSV import");
        }
        return;
    }

    Long authenticatedCompanyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
    if (payloadCompanyId != null && !authenticatedCompanyId.equals(payloadCompanyId)) {
        throw new CsvRowValidationException("companyId", String.valueOf(payloadCompanyId), "CSV row cannot target another company");
    }

    applyAuthenticatedCompanyId(payload, authenticatedCompanyId);
}

    private Long extractCompanyId(Object payload) {
        if (payload instanceof ProductCreate dto) {
            return dto.getCompanyId();
        }
        if (payload instanceof VehicleCreate dto) {
            return dto.getCompanyId();
        }
        if (payload instanceof WarehouseCreate dto) {
            return dto.getCompanyId();
        }
        if (payload instanceof EmployeeCreate dto) {
            return dto.getCompanyId();
        }
        return null;
    }

    private void applyAuthenticatedCompanyId(Object payload, Long companyId) {
        if (payload instanceof ProductCreate dto) {
            dto.setCompanyId(companyId);
        } else if (payload instanceof VehicleCreate dto) {
            dto.setCompanyId(companyId);
        } else if (payload instanceof WarehouseCreate dto) {
            dto.setCompanyId(companyId);
        } else if (payload instanceof EmployeeCreate dto) {
            dto.setCompanyId(companyId);
        }
    }
}
