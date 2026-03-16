package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.service.definition.TransportOrderServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransportOrderService implements TransportOrderServiceDefinition {

    private final TransportOrderRepository _transportOrderRepository;
    private final WarehouseRepository _warehouseRepository;
    private final VehicleRepository _vehicleRepository;
    private final EmployeeRepository _employeeRepository;
    private final UserRepository _userRepository;


    @Override
    public TransportOrderResponse create(TransportOrderCreate dto) {

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));
        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));
        User createdBy = _userRepository.findById(dto.getCreatedById()).orElseThrow(() -> new ResourceNotFoundException("Created by not found"));

        TransportOrder transportOrder = TransportOrderMapper.toEntity(dto, warehouseSource, warehouseDestination, vehicle, assignedEmployee, createdBy);
        TransportOrder saved = _transportOrderRepository.save(transportOrder);
        return TransportOrderMapper.toResponse(saved);

    }

    @Override
    public TransportOrderResponse update(Long id, TransportOrderUpdate dto) {
        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));
        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));
        User createdBy = _userRepository.findById(dto.getCreatedById()).orElseThrow(() -> new ResourceNotFoundException("Created by not found"));

        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        TransportOrderMapper.updateEntity(dto, transportOrder, warehouseSource, warehouseDestination, vehicle, assignedEmployee, createdBy);

        TransportOrder updated = _transportOrderRepository.save(transportOrder);
        return TransportOrderMapper.toResponse(updated);
    }

    @Override
    public TransportOrderResponse getById(Long id) {
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));
        return TransportOrderMapper.toResponse(transportOrder);
    }

    @Override
    public List<TransportOrderResponse> getAll() {
        return _transportOrderRepository.findAll().stream().map(TransportOrderMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));
        _transportOrderRepository.delete(transportOrder);
    }
}
