package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShiftService implements ShiftServiceDefinition {

    private final ShiftRepository _shiftRepository;
    private final EmployeeRepository _employeeRepository;
    private final ActivityLogServiceDefinition activityLogService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public ShiftResponse create(ShiftCreate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (!employee.getUser().getEnabled()) {
            throw new BadRequestException("Inactive employee cannot be assigned to a shift.");
        }

        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlap(employee.getId(), dto.getStartTime(), dto.getEndTime());

        Shift shift = ShiftMapper.toEntity(dto, employee);
        Shift saved = _shiftRepository.save(shift);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "SHIFT",
                saved.getId(),
                "SHIFT is created (ID: " + saved.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return ShiftMapper.toResponse(saved);
    }

    @Override
    public ShiftResponse update(Long id, ShiftUpdate dto) {
        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        validateShiftCanBeModified(shift);
        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlapForUpdate(
                shift.getEmployee().getId(),
                shift.getId(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        ShiftMapper.updateEntity(shift, dto);
        Shift updated = _shiftRepository.save(shift);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "SHIFT",
                updated.getId(),
                "SHIFT is updated (ID: " + updated.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return ShiftMapper.toResponse(updated);
    }

    @Override
    public ShiftResponse getById(Long id) {
        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));
        return ShiftMapper.toResponse(shift);
    }

    @Override
    public List<ShiftResponse> getAll() {
        return _shiftRepository.findAll().stream().map(ShiftMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        _shiftRepository.delete(shift);

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "SHIFT",
                id,
                "SHIFT is deleted (ID: " + id + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    @Override
    public List<ShiftResponse> getShiftsByDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        return _shiftRepository.findShiftsForDay(start, end)
                .stream()
                .map(ShiftMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponse> getShiftBetweenDates(LocalDateTime start, LocalDateTime end) {
        validateShiftTime(start, end);

        return _shiftRepository.findShiftByBetweenDates(start, end).stream().map(ShiftMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void cancelShift(Long id) {
        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned shifts can be cancelled.");
        }

        shift.setStatus(ShiftStatus.CANCELLED);
        _shiftRepository.save(shift);

        activityLogService.create(new ActivityLogCreate(
                "SHIFT_CANCELLED",
                "SHIFT",
                id,
                "SHIFT " + id + " is cancelled",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    @Override
    public ShiftResponse assignShiftToEmployee(Long shiftId, Long employeeId) {
        Shift shift = _shiftRepository.findById(shiftId).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        Employee employee = _employeeRepository.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (!employee.getUser().getEnabled()) {
            throw new BadRequestException("Inactive employee cannot be assigned to a shift.");
        }

        if (shift.getStatus() == ShiftStatus.ACTIVE
                || shift.getStatus() == ShiftStatus.CANCELLED
                || shift.getStatus() == ShiftStatus.FINISHED
                || !shift.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Shift cannot be reassigned.");
        }

        validateShiftOverlapForUpdate(
                employee.getId(),
                shift.getId(),
                shift.getStartTime(),
                shift.getEndTime()
        );

        Employee oldEmployee = shift.getEmployee();
        if (oldEmployee != null) {
            oldEmployee.getShifts().remove(shift);
        }

        shift.setEmployee(employee);
        employee.getShifts().add(shift);

        Shift updatedShift = _shiftRepository.save(shift);
        _employeeRepository.save(employee);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "EMPLOYEE",
                employeeId,
                "EMPLOYEE has been assigned to shift",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "SHIFT",
                shiftId,
                "SHIFT has been assigned to employee",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return ShiftMapper.toResponse(updatedShift);
    }

    // helpers

    private void validateShiftTime(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required.");
        }

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("Shift end time must be after start time.");
        }
    }

    private void validateShiftCanBeModified(Shift shift) {
        if (!shift.getStartTime().isAfter(LocalDateTime.now())
                || shift.getStatus() == ShiftStatus.ACTIVE
                || shift.getStatus() == ShiftStatus.CANCELLED
                || shift.getStatus() == ShiftStatus.FINISHED) {
            throw new BadRequestException("Shift cannot be modified.");
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
}