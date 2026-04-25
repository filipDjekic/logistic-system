package rs.logistics.logistics_system.service.implementation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;

@Service
@RequiredArgsConstructor
public class ShiftService implements ShiftServiceDefinition {

    private final ShiftRepository _shiftRepository;
    private final EmployeeRepository _employeeRepository;
    private final AuditFacadeDefinition auditFacade;
    private final NotificationServiceDefinition notificationService;

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public ShiftResponse create(ShiftCreate dto) {
        Employee employee = getAccessibleEmployee(dto.getEmployeeId());

        validateEmployeeCanBeAssignedToShift(employee);
        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlap(employee.getId(), dto.getStartTime(), dto.getEndTime());

        Shift shift = ShiftMapper.toEntity(dto, employee);
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

        return ShiftMapper.toResponse(saved);
    }

    @Override
    public ShiftResponse update(Long id, ShiftUpdate dto) {
        Shift shift = getShiftOrThrow(id);

        validateShiftCanBeModified(shift);
        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlapForUpdate(
                shift.getEmployee().getId(),
                shift.getId(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        LocalDateTime oldStartTime = shift.getStartTime();
        LocalDateTime oldEndTime = shift.getEndTime();

        ShiftMapper.updateEntity(shift, dto);
        Shift updated = _shiftRepository.save(shift);

        auditFacade.recordFieldChange("SHIFT", updated.getId(), "startTime", oldStartTime, updated.getStartTime());
        auditFacade.recordFieldChange("SHIFT", updated.getId(), "endTime", oldEndTime, updated.getEndTime());

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

        return ShiftMapper.toResponse(updated);
    }

    @Override
    public ShiftResponse getById(Long id) {
        Shift shift = getShiftOrThrow(id);
        return ShiftMapper.toResponse(shift);
    }

    @Override
    public List<ShiftResponse> getAll() {
        List<Shift> shifts = authenticatedUserProvider.isOverlord()
                ? _shiftRepository.findAll()
                : _shiftRepository.findAllByEmployee_Company_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return shifts.stream()
                .map(ShiftMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
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
                .map(ShiftMapper::toResponse)
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
                .map(ShiftMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void cancelShift(Long id) {
        Shift shift = getShiftOrThrow(id);

        validateShiftCanBeCancelled(shift);

        ShiftStatus oldStatus = shift.getStatus();
        shift.setStatus(ShiftStatus.CANCELLED);
        _shiftRepository.save(shift);

        auditFacade.recordStatusChange("SHIFT", id, "status", oldStatus, ShiftStatus.CANCELLED);
        auditFacade.log(
                "SHIFT_CANCELLED",
                "SHIFT",
                id,
                "SHIFT " + id + " is cancelled"
        );

        notifyEmployee(
                shift.getEmployee(),
                "Shift cancelled",
                "Your shift from " + shift.getStartTime() + " to " + shift.getEndTime() + " has been cancelled.",
                NotificationType.WARNING
        );
    }

    @Override
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

        return ShiftMapper.toResponse(updatedShift);
    }

    // helpers

    private void notifyEmployee(Employee employee, String title, String message, NotificationType type) {
        if (employee == null || employee.getUser() == null) {
            return;
        }

        notificationService.createSystemNotification(
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
    }

    private void validateShiftCanBeModified(Shift shift) {
        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned shifts can be modified.");
        }

        if (!shift.getStartTime().isAfter(LocalDateTime.now())) {
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

        if (!shift.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Shift that has started or already passed cannot be deleted.");
        }
    }

    private void validateShiftCanBeCancelled(Shift shift) {
        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned shifts can be cancelled.");
        }

        if (!shift.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Shift that has started or already passed cannot be cancelled.");
        }
    }

    private void validateShiftCanBeReassigned(Shift shift) {
        if (shift.getStatus() != ShiftStatus.PLANNED) {
            throw new BadRequestException("Only planned shifts can be reassigned.");
        }

        if (!shift.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Shift that has started or already passed cannot be reassigned.");
        }
    }

    private Shift getShiftOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _shiftRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));
        }

        return _shiftRepository.findByIdAndEmployee_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));
    }

    private Employee getAccessibleEmployee(Long employeeId) {
        if (authenticatedUserProvider.isOverlord()) {
            return _employeeRepository.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }

        return _employeeRepository.findByIdAndCompany_Id(employeeId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }
}