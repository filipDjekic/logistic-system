package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.mapper.VehicleMapper;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.mapper.WarehouseMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.service.definition.WarehouseServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService implements WarehouseServiceDefinition {

    private final WarehouseRepository _warehouseRepository;
    private final WarehouseInventoryRepository _warehouseInventoryRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final EmployeeRepository _employeeRepository;


    @Override
    public WarehouseResponse create(WarehouseCreate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        validateWarehouseManager(employee);

        Warehouse warehouse = WarehouseMapper.toEntity(dto, employee);
        Warehouse saved = _warehouseRepository.save(warehouse);
        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public WarehouseResponse update(Long id, WarehouseUpdate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        validateWarehouseManager(employee);

        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        WarehouseMapper.updateEntity(warehouse, dto, employee);
        Warehouse saved = _warehouseRepository.save(warehouse);
        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public WarehouseResponse getById(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        return WarehouseMapper.toResponse(warehouse);
    }

    @Override
    public List<WarehouseResponse> getAll() {
        return _warehouseRepository.findAll().stream().map(WarehouseMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        _warehouseRepository.delete(warehouse);
    }

    @Override
    public List<WarehouseInventoryResponse> getInventoryByWarehouse(Long warehouseId) {
        Warehouse warehouse = _warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        return _warehouseInventoryRepository.findByWarehouse_Id(warehouse.getId()).stream().map(WarehouseInventoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<TransportOrderResponse> getOutgoingTransportOrders(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        return _transportOrderRepository.findBySourceWarehouseId(warehouse.getId()).stream().map(TransportOrderMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<TransportOrderResponse> getIncomingTransportOrders(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        return _transportOrderRepository.findByDestinationWarehouseId(warehouse.getId()).stream().map(TransportOrderMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WarehouseResponse> getByManager(Long managerId) {
        Employee manager = _employeeRepository.findById(managerId).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _warehouseRepository.findByManagerId(manager.getId()).stream().map(WarehouseMapper::toResponse).collect(Collectors.toList());
    }

    // helpers

    private void validateWarehouseManager(Employee employee) {
        if (Boolean.FALSE.equals(employee.getActive())) {
            throw new BadRequestException("Inactive employee cannot be assigned as warehouse manager");
        }

        if (employee.getPosition() != EmployeePosition.MANAGER) {
            throw new BadRequestException("Only employee with MANAGER position can be assigned as warehouse manager");
        }
    }
}
