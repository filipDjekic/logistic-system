package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
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

    @Override
    public ShiftResponse create(ShiftCreate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee Not Found"));

        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlap(employee.getId(), dto.getStartTime(), dto.getEndTime());

        Shift shift = ShiftMapper.toEntity(dto, employee);
        Shift saved = _shiftRepository.save(shift);
        return ShiftMapper.toResponse(saved);
    }

    @Override
    public ShiftResponse update(Long id, ShiftUpdate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee Not Found"));

        validateShiftTime(dto.getStartTime(), dto.getEndTime());
        validateShiftOverlapForUpdate(employee.getId(), id, dto.getStartTime(), dto.getEndTime());

        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shift not found"));
        ShiftMapper.updateEntity(shift,dto,employee);
        Shift updated = _shiftRepository.save(shift);
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
    }

    @Override
    public List<ShiftResponse> getShiftsByDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        return _shiftRepository.findShiftsForDay(start, end).stream().map(ShiftMapper::toResponse).collect(Collectors.toList());
    }

    // helpers

    private void validateShiftTime(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required");
        }

        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Shift start time must be before end time");
        }
    }

    private void validateShiftOverlap(Long employeeId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Shift> overlappingShifts = _shiftRepository.findOverlappingShifts(employeeId, startTime, endTime);

        if (!overlappingShifts.isEmpty()) {
            throw new ConflictException("Employee already has a shift in the given time range");
        }
    }

    private void validateShiftOverlapForUpdate(Long employeeId, Long shiftId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Shift> overlappingShifts = _shiftRepository.findOverlappingShiftsForUpdate(employeeId, shiftId, startTime, endTime);

        if (!overlappingShifts.isEmpty()) {
            throw new ConflictException("Employee already has another shift in the given time range");
        }
    }
}
