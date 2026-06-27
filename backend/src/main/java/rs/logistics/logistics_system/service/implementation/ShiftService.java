package rs.logistics.logistics_system.service.implementation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.shiftimport.ShiftImportPreviewResponse;
import rs.logistics.logistics_system.dto.response.shiftimport.ShiftImportRowPreview;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.enums.EmployeeWarehouseAccessType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionContext;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionEngine;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimezoneServiceDefinition;
import rs.logistics.logistics_system.service.support.DomainScopeValidator;

@Service
@RequiredArgsConstructor
public class ShiftService implements ShiftServiceDefinition {

    private final ShiftRepository _shiftRepository;
    private final EmployeeRepository _employeeRepository;
    private final WarehouseRepository warehouseRepository;
    private final AuditFacadeDefinition auditFacade;
    private final NotificationServiceDefinition notificationService;
    private final AppProperties appProperties;
    private final TimezoneServiceDefinition timezoneService;
    private final TimeServiceDefinition timeService;
    private final DomainScopeValidator domainScopeValidator;
    private final LifecycleTransitionEngine lifecycleTransitionEngine;

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional
    public ShiftResponse create(ShiftCreate dto) {
        Employee employee = getAccessibleEmployee(dto.getEmployeeId());

        validateEmployeeCanBeAssignedToShift(employee);
        Warehouse warehouse = resolveShiftWarehouse(dto.getWarehouseId(), employee);
        Timezone timezone = resolveShiftTimezone(dto.getTimezoneId(), employee, warehouse);
        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlap(employee.getId(), dto.getStartTime(), dto.getEndTime());
        validateEmployeeWarehouseCompatibility(employee, warehouse);

        Shift shift = ShiftMapper.toEntity(dto, employee, timezone, warehouse);
        shift.setStatus(ShiftStatus.PLANNED);

        Shift saved = _shiftRepository.save(shift);

        auditFacade.recordCreate("SHIFT", saved.getId());
        auditFacade.log(
                "CREATE",
                "SHIFT",
                saved.getId(),
                "SHIFT is created (ID: " + saved.getId() + ")"
        );

        notifyEmployee(
                saved.getEmployee(),
                "Shift assigned",
                "You have been assigned to a shift from " + saved.getStartTime() + " to " + saved.getEndTime() + ".",
                NotificationType.INFO
        );

        return ShiftMapper.toResponse(saved, timeService);
    }


    @Override
    public ShiftImportPreviewResponse previewImport(MultipartFile file) {
        return buildImportPreview(file, false);
    }

    @Override
    @Transactional
    public ShiftImportPreviewResponse confirmImport(MultipartFile file) {
        return buildImportPreview(file, true);
    }

    private ShiftImportPreviewResponse buildImportPreview(MultipartFile file, boolean persist) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is required.");
        }

        List<ShiftImportRowPreview> rows = parseShiftImportRows(file);
        Map<Long, List<ShiftImportRowPreview>> validRowsByEmployee = new HashMap<>();

        for (ShiftImportRowPreview row : rows) {
            validateImportRow(row);
            if (row.getErrors().isEmpty()) {
                row.setValid(true);
                validRowsByEmployee.computeIfAbsent(row.getEmployeeId(), ignored -> new ArrayList<>()).add(row);
            }
        }

        validateImportInternalOverlaps(validRowsByEmployee);

        int validRows = (int) rows.stream().filter(ShiftImportRowPreview::isValid).count();
        int invalidRows = rows.size() - validRows;

        if (persist) {
            if (rows.isEmpty()) {
                throw new BadRequestException("CSV file does not contain shift rows.");
            }
            if (invalidRows > 0) {
                throw new BadRequestException("CSV import contains invalid rows. Fix errors before confirming import.");
            }
            for (ShiftImportRowPreview row : rows) {
                create(toShiftCreate(row));
            }
        }

        return new ShiftImportPreviewResponse(
                rows.size(),
                validRows,
                invalidRows,
                !rows.isEmpty() && invalidRows == 0,
                persist ? validRows : null,
                rows
        );
    }

    private List<ShiftImportRowPreview> parseShiftImportRows(MultipartFile file) {
        List<ShiftImportRowPreview> rows = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null || header.isBlank()) {
                throw new BadRequestException("CSV header is required.");
            }

            Map<String, Integer> headerIndexes = resolveCsvHeader(header);
            requireCsvColumn(headerIndexes, "employeeId");
            requireCsvColumn(headerIndexes, "startTime");
            requireCsvColumn(headerIndexes, "endTime");
            requireCsvColumn(headerIndexes, "timezoneId");

            String line;
            int rowNumber = 1;
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (line.isBlank()) {
                    continue;
                }

                List<String> values = splitCsvLine(line);
                ShiftImportRowPreview row = new ShiftImportRowPreview(rowNumber);
                row.setEmployeeId(parseLongCell(values, headerIndexes, "employeeId", row));
                row.setStartTime(parseDateTimeCell(values, headerIndexes, "startTime", row));
                row.setEndTime(parseDateTimeCell(values, headerIndexes, "endTime", row));
                row.setTimezoneId(parseLongCell(values, headerIndexes, "timezoneId", row));
                row.setWarehouseId(parseOptionalLongCell(values, headerIndexes, "warehouseId", row));
                row.setNotes(readOptionalCell(values, headerIndexes, "notes"));
                rows.add(row);
            }
        } catch (IOException ex) {
            throw new BadRequestException("CSV file could not be read.");
        }

        return rows;
    }

    private void validateImportRow(ShiftImportRowPreview row) {
        if (!row.getErrors().isEmpty()) {
            return;
        }

        try {
            Employee employee = getAccessibleEmployee(row.getEmployeeId());
            row.setEmployeeLabel(employee.getFirstName() + " " + employee.getLastName() + " (ID: " + employee.getId() + ")");
            validateEmployeeCanBeAssignedToShift(employee);
            Warehouse warehouse = resolveShiftWarehouse(row.getWarehouseId(), employee);
            Timezone timezone = resolveShiftTimezone(row.getTimezoneId(), employee, warehouse);
            row.setTimezoneId(timezone.getId());
            row.setWarehouseId(warehouse != null ? warehouse.getId() : null);
            validateShiftTime(row.getStartTime(), row.getEndTime());
            validateShiftOverlap(employee.getId(), row.getStartTime(), row.getEndTime());
            validateEmployeeWarehouseCompatibility(employee, warehouse);
        } catch (RuntimeException ex) {
            row.addError(ex.getMessage() != null ? ex.getMessage() : "Invalid shift row.");
        }
    }

    private void validateImportInternalOverlaps(Map<Long, List<ShiftImportRowPreview>> rowsByEmployee) {
        for (List<ShiftImportRowPreview> employeeRows : rowsByEmployee.values()) {
            for (int i = 0; i < employeeRows.size(); i++) {
                ShiftImportRowPreview current = employeeRows.get(i);
                for (int j = i + 1; j < employeeRows.size(); j++) {
                    ShiftImportRowPreview other = employeeRows.get(j);
                    if (current.getStartTime().isBefore(other.getEndTime()) && current.getEndTime().isAfter(other.getStartTime())) {
                        current.addError("Overlaps with CSV row " + other.getRowNumber() + ".");
                        other.addError("Overlaps with CSV row " + current.getRowNumber() + ".");
                    }
                }
            }
        }
    }

    private ShiftCreate toShiftCreate(ShiftImportRowPreview row) {
        ShiftCreate dto = new ShiftCreate();
        dto.setEmployeeId(row.getEmployeeId());
        dto.setStartTime(row.getStartTime());
        dto.setEndTime(row.getEndTime());
        dto.setTimezoneId(row.getTimezoneId());
        dto.setWarehouseId(row.getWarehouseId());
        dto.setNotes(row.getNotes());
        return dto;
    }

    private Map<String, Integer> resolveCsvHeader(String headerLine) {
        List<String> columns = splitCsvLine(headerLine);
        Map<String, Integer> indexes = new HashMap<>();
        for (int i = 0; i < columns.size(); i++) {
            indexes.put(columns.get(i).trim(), i);
        }
        return indexes;
    }

    private void requireCsvColumn(Map<String, Integer> indexes, String column) {
        if (!indexes.containsKey(column)) {
            throw new BadRequestException("CSV column is required: " + column);
        }
    }

    private Long parseLongCell(List<String> values, Map<String, Integer> indexes, String column, ShiftImportRowPreview row) {
        String value = readRequiredCell(values, indexes, column, row);
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            row.addError("Column " + column + " must be a number.");
            return null;
        }
    }

    private Long parseOptionalLongCell(List<String> values, Map<String, Integer> indexes, String column, ShiftImportRowPreview row) {
        String value = readOptionalCell(values, indexes, column);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            row.addError("Column " + column + " must be a number.");
            return null;
        }
    }

    private LocalDateTime parseDateTimeCell(List<String> values, Map<String, Integer> indexes, String column, ShiftImportRowPreview row) {
        String value = readRequiredCell(values, indexes, column, row);
        if (value == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.length() == 16 ? value + ":00" : value);
        } catch (RuntimeException ex) {
            row.addError("Column " + column + " must be ISO local datetime, for example 2026-06-01T06:00.");
            return null;
        }
    }

    private String readRequiredCell(List<String> values, Map<String, Integer> indexes, String column, ShiftImportRowPreview row) {
        String value = readOptionalCell(values, indexes, column);
        if (value == null || value.isBlank()) {
            row.addError("Column " + column + " is required.");
            return null;
        }
        return value.trim();
    }

    private String readOptionalCell(List<String> values, Map<String, Integer> indexes, String column) {
        Integer index = indexes.get(column);
        if (index == null || index >= values.size()) {
            return null;
        }
        String value = values.get(index);
        return value != null ? value.trim() : null;
    }

    private List<String> splitCsvLine(String line) {
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
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        values.add(current.toString());
        return values;
    }

    @Override
    @Transactional
    public ShiftResponse update(Long id, ShiftUpdate dto) {
        Shift shift = getShiftOrThrow(id);

        validateShiftCanBeModified(shift);
        Warehouse warehouse = resolveShiftWarehouse(dto.getWarehouseId(), shift.getEmployee());
        Timezone timezone = resolveShiftTimezone(dto.getTimezoneId(), shift.getEmployee(), warehouse);
        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlapForUpdate(
                shift.getEmployee().getId(),
                shift.getId(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        LocalDateTime oldStartTime = shift.getStartTime();
        LocalDateTime oldEndTime = shift.getEndTime();
        Long oldTimezoneId = shift.getTimezone() != null ? shift.getTimezone().getId() : null;
        Long oldWarehouseId = shift.getWarehouse() != null ? shift.getWarehouse().getId() : null;
        validateEmployeeWarehouseCompatibility(shift.getEmployee(), warehouse);

        ShiftMapper.updateEntity(shift, dto, timezone, warehouse);
        Shift updated = _shiftRepository.save(shift);

        auditFacade.recordFieldChange("SHIFT", updated.getId(), "startTime", oldStartTime, updated.getStartTime());
        auditFacade.recordFieldChange("SHIFT", updated.getId(), "endTime", oldEndTime, updated.getEndTime());
        auditFacade.recordFieldChange("SHIFT", updated.getId(), "timezone_id", oldTimezoneId, updated.getTimezone() != null ? updated.getTimezone().getId() : null);
        auditFacade.recordFieldChange("SHIFT", updated.getId(), "warehouse_id", oldWarehouseId, updated.getWarehouse() != null ? updated.getWarehouse().getId() : null);

        auditFacade.log(
                "UPDATE",
                "SHIFT",
                updated.getId(),
                "SHIFT is updated (ID: " + updated.getId() + ")"
        );

        notifyEmployee(
                updated.getEmployee(),
                "Shift updated",
                "Your shift has been updated. New time: " + updated.getStartTime() + " to " + updated.getEndTime() + ".",
                NotificationType.INFO
        );

        return ShiftMapper.toResponse(updated, timeService);
    }

    @Override
    public ShiftResponse getById(Long id) {
        Shift shift = getShiftOrThrow(id);
        return ShiftMapper.toResponse(shift, timeService);
    }

    @Override
    public PageResponse<ShiftResponse> getAll(Pageable pageable) {
        var shifts = authenticatedUserProvider.isOverlord()
                ? _shiftRepository.findAll(pageable)
                : _shiftRepository.findAllByEmployee_Company_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(), pageable);

        return PageResponse.from(shifts.map(shift -> ShiftMapper.toResponse(shift, timeService)));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Shift shift = getShiftOrThrow(id);

        validateShiftCanBeDeleted(shift);

        _shiftRepository.delete(shift);

        auditFacade.recordDelete("SHIFT", id);
        auditFacade.log(
                "DELETE",
                "SHIFT",
                id,
                "SHIFT is deleted (ID: " + id + ")"
        );
    }

    @Override
    public List<ShiftResponse> getShiftsByDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        List<Shift> shifts = authenticatedUserProvider.isOverlord()
                ? _shiftRepository.findShiftsForDay(start, end)
                : _shiftRepository.findShiftsForDayAndCompany(
                start,
                end,
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        );

        return shifts.stream()
                .map(shift -> ShiftMapper.toResponse(shift, timeService))
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponse> getShiftBetweenDates(LocalDateTime start, LocalDateTime end) {
        validateShiftTime(start, end);

        List<Shift> shifts = authenticatedUserProvider.isOverlord()
                ? _shiftRepository.findShiftByBetweenDates(start, end)
                : _shiftRepository.findShiftByBetweenDatesAndCompany(
                start,
                end,
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        );

        return shifts.stream()
                .map(shift -> ShiftMapper.toResponse(shift, timeService))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelShift(Long id) {
        Shift shift = getShiftOrThrow(id);

        validateShiftCanBeCancelled(shift);

        ShiftStatus oldStatus = shift.getStatus();
        LifecycleTransitionContext<ShiftStatus> lifecycleContext = lifecycleTransitionEngine.validate(
                LifecycleEntityType.SHIFT,
                shift.getId(),
                ShiftStatus.class,
                oldStatus,
                ShiftStatus.CANCELLED,
                "Shift cancelled",
                null,
                null
        );

        shift.setStatus(ShiftStatus.CANCELLED);
        Shift saved = _shiftRepository.save(shift);

        auditFacade.recordStatusChange("SHIFT", saved.getId(), "status", oldStatus, saved.getStatus());
        auditFacade.log(
                "SHIFT_CANCELLED",
                "SHIFT",
                saved.getId(),
                "SHIFT " + saved.getId() + " is cancelled"
        );

        lifecycleTransitionEngine.afterTransition(lifecycleContext, ShiftStatus.class);

        notifyEmployee(
                saved.getEmployee(),
                "Shift cancelled",
                "Your shift from " + saved.getStartTime() + " to " + saved.getEndTime() + " has been cancelled.",
                NotificationType.WARNING
        );
    }

    @Override
    @Transactional
    public ShiftResponse assignShiftToEmployee(Long shiftId, Long employeeId) {
        Shift shift = getShiftOrThrow(shiftId);
        Employee employee = getAccessibleEmployee(employeeId);

        validateEmployeeCanBeAssignedToShift(employee);
        validateShiftCanBeReassigned(shift);
        validateShiftOverlapForUpdate(
                employee.getId(),
                shift.getId(),
                shift.getStartTime(),
                shift.getEndTime()
        );

        if (!authenticatedUserProvider.isOverlord()) {
            authenticatedUserProvider.ensureSameCompany(
                    shift.getEmployee() != null && shift.getEmployee().getCompany() != null ? shift.getEmployee().getCompany().getId() : null,
                    employee.getCompany() != null ? employee.getCompany().getId() : null,
                    "Shift can be reassigned only within the same company"
            );
        }

        Employee oldEmployee = shift.getEmployee();
        if (oldEmployee != null) {
            oldEmployee.getShifts().remove(shift);
        }

        Long oldEmployeeId = oldEmployee != null ? oldEmployee.getId() : null;

        shift.setEmployee(employee);
        shift.setWarehouse(resolveShiftWarehouse(shift.getWarehouse() != null ? shift.getWarehouse().getId() : null, employee));
        validateEmployeeWarehouseCompatibility(employee, shift.getWarehouse());
        shift.setTimezone(resolveShiftTimezone(null, employee, shift.getWarehouse()));
        employee.getShifts().add(shift);

        Shift updatedShift = _shiftRepository.save(shift);
        _employeeRepository.save(employee);

        auditFacade.recordFieldChange("SHIFT", shiftId, "employee", oldEmployeeId, employeeId);
        auditFacade.log(
                "ASSIGN",
                "SHIFT",
                shiftId,
                "SHIFT has been assigned to employee " + employeeId
        );

        if (oldEmployee != null && oldEmployee.getUser() != null && !oldEmployee.getId().equals(employee.getId())) {
            notifyEmployee(
                    oldEmployee,
                    "Shift reassigned",
                    "Your shift from " + updatedShift.getStartTime() + " to " + updatedShift.getEndTime() + " is no longer assigned to you.",
                    NotificationType.WARNING
            );
        }

        notifyEmployee(
                employee,
                "Shift assigned",
                "You have been assigned to a shift from " + updatedShift.getStartTime() + " to " + updatedShift.getEndTime() + ".",
                NotificationType.INFO
        );

        return ShiftMapper.toResponse(updatedShift, timeService);
    }

    
    
    @Override
    @Transactional
    public void synchronizeShiftStatuses() {
        LocalDateTime now = timeService.nowSystem();

        List<Shift> shiftsToActivate = _shiftRepository.findPlannedShiftsToActivate(now);
        for (Shift shift : shiftsToActivate) {
            moveShiftBySystem(
                    shift,
                    ShiftStatus.ACTIVE,
                    "Shift started automatically",
                    "SHIFT_AUTO_ACTIVATED",
                    "automatically changed from PLANNED to ACTIVE",
                    "Shift started",
                    "is now active."
            );
        }

        List<Shift> shiftsToFinish = _shiftRepository.findActiveShiftsToFinish(now);
        for (Shift shift : shiftsToFinish) {
            moveShiftBySystem(
                    shift,
                    ShiftStatus.FINISHED,
                    "Shift finished automatically",
                    "SHIFT_AUTO_FINISHED",
                    "automatically changed from ACTIVE to FINISHED",
                    "Shift finished",
                    "is now finished."
            );
        }
    }
    private Shift moveShiftBySystem(
            Shift shift,
            ShiftStatus targetStatus,
            String reason,
            String auditAction,
            String auditMessage,
            String notificationTitle,
            String notificationSuffix
    ) {
        ShiftStatus oldStatus = shift.getStatus();
        LifecycleTransitionContext<ShiftStatus> lifecycleContext = lifecycleTransitionEngine.validateSystem(
                LifecycleEntityType.SHIFT,
                shift.getId(),
                ShiftStatus.class,
                oldStatus,
                targetStatus,
                reason,
                null
        );

        shift.setStatus(targetStatus);
        Shift saved = _shiftRepository.save(shift);

        auditFacade.recordSystemStatusChange("SHIFT", saved.getId(), null, "status", oldStatus, saved.getStatus());
        auditFacade.logSystem(
                auditAction,
                "SHIFT",
                saved.getId(),
                null,
                "SHIFT " + saved.getId() + " " + auditMessage + " using timezone " + (saved.getTimezone() != null ? saved.getTimezone().getName() : null)
        );

        lifecycleTransitionEngine.afterTransition(lifecycleContext, ShiftStatus.class);

        notifyEmployee(
                saved.getEmployee(),
                notificationTitle,
                "Your shift from " + saved.getStartTime() + " to " + saved.getEndTime() + " " + notificationSuffix,
                NotificationType.INFO
        );

        return saved;
    }

    private void notifyEmployee(Employee employee, String title, String message, NotificationType type) {
        if (employee == null || employee.getUser() == null) {
            return;
        }

        notificationService.createInternalSystemNotification(
                employee.getUser().getId(),
                title,
                message,
                type
        );
    }

    private void validateEmployeeCanBeAssignedToShift(Employee employee) {
        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new BadRequestException("Inactive employee cannot be assigned to a shift.");
        }

        if (employee.getUser() == null) {
            throw new BadRequestException("Employee without a user account cannot be assigned to a shift.");
        }

        if (!Boolean.TRUE.equals(employee.getUser().getEnabled())) {
            throw new BadRequestException("Employee with a disabled user account cannot be assigned to a shift.");
        }
    }

    private void validateShiftTime(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required.");
        }

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("Shift end time must be after start time.");
        }

        Duration duration = Duration.between(startTime, endTime);

        long maxShiftDurationHours = appProperties.getMaxShiftDurationHours();

        if (duration.toMinutes() > maxShiftDurationHours * 60) {
            throw new BadRequestException("Shift cannot be longer than " + maxShiftDurationHours + " hours.");
        }
    }

    private void validateShiftCanBeModified(Shift shift) {
        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned shifts can be modified.");
        }

        if (!shift.getStartTime().isAfter(nowForShift(shift))) {
            throw new BadRequestException("Shift that has started or already passed cannot be modified.");
        }
    }

    private void validateShiftOverlap(Long employeeId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Shift> overlappingShifts = _shiftRepository.findOverlappingShifts(employeeId, startTime, endTime);

        if (!overlappingShifts.isEmpty()) {
            throw new ConflictException("Employee already has a shift in the given time range.");
        }
    }

    private void validateShiftOverlapForUpdate(Long employeeId, Long shiftId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Shift> overlappingShifts = _shiftRepository.findOverlappingShiftsForUpdate(employeeId, shiftId, startTime, endTime);

        if (!overlappingShifts.isEmpty()) {
            throw new ConflictException("Employee already has another shift in the given time range.");
        }
    }

    private void validateShiftCanBeDeleted(Shift shift) {
        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned future shifts can be deleted. Started, finished or cancelled shifts must remain in history.");
        }

        if (!shift.getStartTime().isAfter(nowForShift(shift))) {
            throw new BadRequestException("Shift that has started or already passed cannot be deleted.");
        }
    }

    private void validateShiftCanBeCancelled(Shift shift) {
        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned shifts can be cancelled.");
        }

        if (!shift.getStartTime().isAfter(nowForShift(shift))) {
            throw new BadRequestException("Shift that has started or already passed cannot be cancelled.");
        }
    }

    private void validateShiftCanBeReassigned(Shift shift) {
        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned shifts can be reassigned.");
        }

        if (!shift.getStartTime().isAfter(nowForShift(shift))) {
            throw new BadRequestException("Shift that has started or already passed cannot be reassigned.");
        }
    }

    private LocalDateTime nowForShift(Shift shift) {
        return timeService.nowForShift(shift);
    }

    private Warehouse resolveShiftWarehouse(Long requestedWarehouseId, Employee employee) {
        if (requestedWarehouseId != null) {
            Warehouse warehouse = authenticatedUserProvider.isOverlord()
                    ? warehouseRepository.findById(requestedWarehouseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"))
                    : warehouseRepository.findByIdAndCompany_Id(requestedWarehouseId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
            return warehouse;
        }
        return employee != null ? employee.getPrimaryWarehouse() : null;
    }

    private void validateEmployeeWarehouseCompatibility(Employee employee, Warehouse warehouse) {
        if (warehouse == null) {
            if (employee != null && (employee.getPosition() == rs.logistics.logistics_system.enums.EmployeePosition.WORKER
                    || employee.getPosition() == rs.logistics.logistics_system.enums.EmployeePosition.WAREHOUSE_MANAGER)) {
                throw new BadRequestException("Warehouse is required for operational warehouse shifts");
            }
            return;
        }
        if (employee != null && employee.getCompany() != null && warehouse.getCompany() != null
                && !employee.getCompany().getId().equals(warehouse.getCompany().getId())) {
            throw new ForbiddenException("Shift warehouse must belong to employee company");
        }
        if (employee != null && employee.getPosition() == rs.logistics.logistics_system.enums.EmployeePosition.WORKER
                && !domainScopeValidator.hasWarehouseAccess(employee, warehouse, EmployeeWarehouseAccessType.WORKER, EmployeeWarehouseAccessType.PRIMARY)) {
            throw new ForbiddenException("WORKER shifts can only be planned in primary or assigned warehouse");
        }
        if (employee != null && employee.getPosition() == rs.logistics.logistics_system.enums.EmployeePosition.WAREHOUSE_MANAGER
                && !domainScopeValidator.hasWarehouseAccess(employee, warehouse, EmployeeWarehouseAccessType.MANAGER, EmployeeWarehouseAccessType.PRIMARY)) {
            throw new ForbiddenException("WAREHOUSE_MANAGER shifts can only be planned in managed or assigned warehouse");
        }
    }

    private Timezone resolveShiftTimezone(Long requestedTimezoneId, Employee employee) {
        return resolveShiftTimezone(requestedTimezoneId, employee, employee != null ? employee.getPrimaryWarehouse() : null);
    }

    private Timezone resolveShiftTimezone(Long requestedTimezoneId, Employee employee, Warehouse warehouse) {
        Country country = employee != null && employee.getCountry() != null
                ? employee.getCountry()
                : employee != null && employee.getCompany() != null
                ? employee.getCompany().getCountry()
                : null;

        if (requestedTimezoneId != null) {
            if (country == null) {
                throw new BadRequestException("Employee country is required before timezone can be selected");
            }
            return timezoneService.getRequiredForCountry(requestedTimezoneId, country.getId());
        }

        if (employee != null && employee.getTimezone() != null) {
            return employee.getTimezone();
        }
        if (warehouse != null && warehouse.getTimezone() != null) {
            return warehouse.getTimezone();
        }
        if (employee != null && employee.getPrimaryWarehouse() != null && employee.getPrimaryWarehouse().getTimezone() != null) {
            return employee.getPrimaryWarehouse().getTimezone();
        }
        if (employee != null && employee.getCompany() != null && employee.getCompany().getTimezone() != null) {
            return employee.getCompany().getTimezone();
        }
        if (country != null && country.getDefaultTimezone() != null) {
            return country.getDefaultTimezone();
        }
        throw new BadRequestException("Timezone is required");
    }


    private Shift getShiftOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _shiftRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Shift not found"));
        }

        return _shiftRepository.findByIdAndEmployee_Company_Id(
                        id,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found"));
    }

    private Employee getAccessibleEmployee(Long employeeId) {
        if (authenticatedUserProvider.isOverlord()) {
            return _employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }

        return _employeeRepository.findByIdAndCompany_Id(
                        employeeId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }
}
