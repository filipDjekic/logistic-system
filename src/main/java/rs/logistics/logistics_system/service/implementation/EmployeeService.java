package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.EmployeeMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.EmployeeServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService implements EmployeeServiceDefinition {

    private final EmployeeRepository _employeeRepository;
    private final UserRepository _userRepository;

    @Override
    public EmployeeResponse create(EmployeeCreate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() ->  new ResourceNotFoundException("User not found"));
        Employee employee = EmployeeMapper.toEntity(dto, user);
        Employee saved = _employeeRepository.save(employee);
        return EmployeeMapper.toResponse(saved);
    }

    @Override
    public EmployeeResponse update(Long id, EmployeeUpdate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() ->  new ResourceNotFoundException("User not found"));
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        EmployeeMapper.updateEntity(dto, employee, user);
        Employee updated = _employeeRepository.save(employee);
        return EmployeeMapper.toResponse(updated);
    }

    @Override
    public EmployeeResponse getById(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return EmployeeMapper.toResponse(employee);
    }

    @Override
    public List<EmployeeResponse> getAll() {
        return _employeeRepository.findAll().stream().map(EmployeeMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Employee employee = _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        _employeeRepository.delete(employee);
    }
}
