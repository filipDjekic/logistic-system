package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.mapper.ShiftMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShiftService implements ShiftServiceDefinition {

    private final ShiftRepository _shiftRepository;
    private final EmployeeRepository _employeeRepository;

    @Override
    public ShiftResponse create(ShiftCreate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new RuntimeException("Employee Not Found"));
        Shift shift = ShiftMapper.toEntity(dto, employee);
        Shift saved = _shiftRepository.save(shift);
        return ShiftMapper.toResponse(saved);
    }

    @Override
    public ShiftResponse update(Long id, ShiftUpdate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new RuntimeException("Employee Not Found"));
        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new RuntimeException("Shift not found"));
        ShiftMapper.updateEntity(shift,dto,employee);
        Shift updated = _shiftRepository.save(shift);
        return ShiftMapper.toResponse(updated);
    }

    @Override
    public ShiftResponse getById(Long id) {
        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new RuntimeException("Shift not found"));
        return ShiftMapper.toResponse(shift);
    }

    @Override
    public List<ShiftResponse> getAll() {
        return _shiftRepository.findAll().stream().map(ShiftMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Shift shift = _shiftRepository.findById(id).orElseThrow(() -> new RuntimeException("Shift not found"));
        _shiftRepository.delete(shift);
    }
}
