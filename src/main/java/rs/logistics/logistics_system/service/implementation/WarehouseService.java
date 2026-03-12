package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.mapper.VehicleMapper;
import rs.logistics.logistics_system.mapper.WarehouseMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.service.definition.WarehouseServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService implements WarehouseServiceDefinition {

    private final WarehouseRepository _warehouseRepository;
    private final EmployeeRepository _employeeRepository;


    @Override
    public WarehouseResponse create(WarehouseCreate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new RuntimeException("Employee not found"));
        Warehouse warehouse = WarehouseMapper.toEntity(dto, employee);
        Warehouse saved = _warehouseRepository.save(warehouse);
        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public WarehouseResponse update(Long id, WarehouseUpdate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new RuntimeException("Employee not found"));
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new RuntimeException("Warehouse not found"));
        WarehouseMapper.updateEntity(warehouse, dto, employee);
        Warehouse saved = _warehouseRepository.save(warehouse);
        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public WarehouseResponse getById(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new RuntimeException("Warehouse not found"));
        return WarehouseMapper.toResponse(warehouse);
    }

    @Override
    public List<WarehouseResponse> getAll() {
        return _warehouseRepository.findAll().stream().map(WarehouseMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new RuntimeException("Warehouse not found"));
        _warehouseRepository.delete(warehouse);
    }
}
