package rs.logistics.logistics_system.service.implementation;

import java.time.LocalDateTime;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.ChangeType;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;
import rs.logistics.logistics_system.service.definition.TransportOrderServiceDefinition;

import java.math.BigDecimal;
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

    private static final List<TransportOrderStatus> ACTIVE_STATUSES = Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);
    private final ActivityLogServiceDefinition activityLogService;
    private final ChangeHistoryServiceDefinition changeHistoryService;


    @Override
    public TransportOrderResponse create(TransportOrderCreate dto) {

        if(dto.getVehicleId() == null || dto.getAssignedEmployeeId() == null || dto.getSourceWarehouseId() == null || dto.getDestinationWarehouseId() == null || dto.getCreatedById() == null){
            throw new BadRequestException("Invalid request");
        }

        if(dto.getTotalWeight().compareTo(BigDecimal.ZERO) <= 0){
            throw new BadRequestException("Total weight must be greater than 0");
        }

        if(dto.getPlannedArrivalTime().isBefore(dto.getDepartureTime())){
            throw new BadRequestException("Planned arrival time must be after departure time");
        }

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        if(warehouseSource.getId().equals(warehouseDestination.getId())){
            throw new BadRequestException("Warehouse Source and Destination are the same");
        }

        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));

        validateVehicleStatus(vehicle);
        checkVehicleAvailability(vehicle.getId());
        checkDriverAvailability(assignedEmployee.getId());

        User createdBy = _userRepository.findById(dto.getCreatedById()).orElseThrow(() -> new ResourceNotFoundException("Created by not found"));

        TransportOrder transportOrder = TransportOrderMapper.toEntity(dto, warehouseSource, warehouseDestination, vehicle, assignedEmployee, createdBy);
        transportOrder.setStatus(TransportOrderStatus.CREATED);

        TransportOrder saved = _transportOrderRepository.save(transportOrder);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "TRANSPORT_ORDER",
                saved.getId(),
                "TRANSPORT ORDER is created (ID: " + saved.getId() + ")",
                saved.getCreatedBy().getId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TRANSPORT_ORDER",
                saved.getId(),
                ChangeType.CREATE,
                "ENTITY",
                " ",
                " ",
                saved.getCreatedBy().getId()
        ));

        return TransportOrderMapper.toResponse(saved);

    }

    @Override
    public TransportOrderResponse update(Long id, TransportOrderUpdate dto) {

        if(dto.getVehicleId() == null || dto.getAssignedEmployeeId() == null || dto.getSourceWarehouseId() == null || dto.getDestinationWarehouseId() == null || dto.getCreatedById() == null){
            throw new BadRequestException("Invalid request");
        }

        if(dto.getTotalWeight().compareTo(BigDecimal.ZERO) <= 0){
            throw new BadRequestException("Total weight must be greater than 0");
        }

        if(dto.getPlannedArrivalTime().isBefore(dto.getDepartureTime())){
            throw new BadRequestException("Planned arrival time must be after departure time");
        }

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        if(warehouseSource.getId().equals(warehouseDestination.getId())){
            throw new BadRequestException("Warehouse Source and Destination are the same");
        }

        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));
        User createdBy = _userRepository.findById(dto.getCreatedById()).orElseThrow(() -> new ResourceNotFoundException("Created by not found"));

        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        // change history part

        if(!dto.getAssignedEmployeeId().equals(transportOrder.getAssignedEmployee().getId())){
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TRANSPORT_ORDER",
                    transportOrder.getId(),
                    ChangeType.UPDATE,
                    "assignedEmployee",
                    transportOrder.getAssignedEmployee().getId().toString(),
                    dto.getAssignedEmployeeId().toString(),
                    transportOrder.getId()
            ));
        }

        if(!dto.getVehicleId().equals(transportOrder.getVehicle().getId())){
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TRANSPORT_ORDER",
                    transportOrder.getId(),
                    ChangeType.UPDATE,
                    "vehicle",
                    transportOrder.getVehicle().getId().toString(),
                    dto.getVehicleId().toString(),
                    transportOrder.getId()
            ));
        }

        // end

        if(transportOrder.getStatus() == TransportOrderStatus.ASSIGNED || transportOrder.getStatus() == TransportOrderStatus.IN_TRANSIT){
            validateVehicleStatus(vehicle);
        }

        checkVehicleAvailabilityForUpdate(vehicle.getId(), transportOrder.getId());
        checkDriverAvailabilityForUpdate(assignedEmployee.getId(), transportOrder.getId());

        TransportOrderMapper.updateEntity(dto, transportOrder, warehouseSource, warehouseDestination, vehicle, assignedEmployee, createdBy);

        TransportOrder updated = _transportOrderRepository.save(transportOrder);

        activityLogService.create(new ActivityLogCreate(
                "UPDATED",
                "TRANSPORT_ORDER",
                updated.getId(),
                "TRANSPORT ORDER is being updated (ID: " + updated.getId() + ")",
                updated.getCreatedBy().getId()
        ));



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
        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "TRANSPORT_ORDER",
                id,
                "TRANSPORT ORDER is deleted (ID: " + id + ")",
                id
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TRANSPORT_ORDER",
                id,
                ChangeType.DELETE,
                " ",
                " ",
                " ",
                id
        ));
    }

    @Override
    public TransportOrderResponse changeStatus(Long id, TransportOrderStatus status) {
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));
        TransportOrderStatus current = transportOrder.getStatus();

        if (status == TransportOrderStatus.ASSIGNED || status == TransportOrderStatus.IN_TRANSIT) {
            validateVehicleStatus(transportOrder.getVehicle());
            checkVehicleAvailabilityForUpdate(transportOrder.getVehicle().getId(), transportOrder.getId());
            checkDriverAvailabilityForUpdate(transportOrder.getAssignedEmployee().getId(), transportOrder.getId());
        }

        switch (current){
            case TransportOrderStatus.CREATED:
                if(status.equals(TransportOrderStatus.ASSIGNED) || status.equals(TransportOrderStatus.CANCELLED)){
                    transportOrder.setStatus(status);
                }
                else{
                    throw new BadRequestException("Transport order cannot be changed to this");
                }
                break;
            case TransportOrderStatus.ASSIGNED:
                if(status.equals(TransportOrderStatus.IN_TRANSIT) || status.equals(TransportOrderStatus.CANCELLED)){
                    transportOrder.setStatus(status);
                }
                else{
                    throw new BadRequestException("Transport order cannot be changed to this");
                }
                break;
            case  TransportOrderStatus.IN_TRANSIT:
                if(status.equals(TransportOrderStatus.DELIVERED)){
                    transportOrder.setStatus(status);
                }
                else {
                    throw new BadRequestException("Transport order cannot be changed to this");
                }
                break;
            case TransportOrderStatus.DELIVERED:
                throw new BadRequestException("Transport order cannot be changed at all");
            case TransportOrderStatus.CANCELLED:
                throw new BadRequestException("Transport order cannot be changed at all");
        }

        if (status == TransportOrderStatus.ASSIGNED || status == TransportOrderStatus.IN_TRANSIT) {
            transportOrder.getVehicle().setStatus(VehicleStatus.IN_USE);
        }

        if (status == TransportOrderStatus.DELIVERED || status == TransportOrderStatus.CANCELLED) {
            transportOrder.getVehicle().setStatus(VehicleStatus.AVAILABLE);
        }

        _vehicleRepository.save(transportOrder.getVehicle());

        TransportOrder saved = _transportOrderRepository.save(transportOrder);

        activityLogService.create(new ActivityLogCreate(
                "STATUS_CHANGED",
                "TRANSPORT_ORDER",
                saved.getId(),
                "TRANSPORT ORDER status changed (ID: " + saved.getId() + ")",
                saved.getCreatedBy().getId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TRANSPORT_ORDER",
                id,
                ChangeType.STATUS_CHANGE,
                "status",
                current.toString(),
                saved.getStatus().toString(),
                saved.getCreatedBy().getId()

        ));

        return TransportOrderMapper.toResponse(saved);
    }

    // helpers

    private void checkVehicleAvailability(Long vehicleId) {
        if (_transportOrderRepository.existsByVehicleIdAndStatusIn(vehicleId, ACTIVE_STATUSES)) {
            throw new BadRequestException("Vehicle is already assigned to another active transport order");
        }
    }

    private void checkDriverAvailability(Long employeeId) {
        if (_transportOrderRepository.existsByAssignedEmployeeIdAndStatusIn(employeeId, ACTIVE_STATUSES)) {
            throw new BadRequestException("Driver is already assigned to another active transport order");
        }
    }

    private void checkVehicleAvailabilityForUpdate(Long vehicleId, Long transportOrderId) {
        if (_transportOrderRepository.existsByVehicleIdAndStatusInAndIdNot(vehicleId, ACTIVE_STATUSES, transportOrderId)) {
            throw new BadRequestException("Vehicle is already assigned to another active transport order");
        }
    }

    private void checkDriverAvailabilityForUpdate(Long employeeId, Long transportOrderId) {
        if (_transportOrderRepository.existsByAssignedEmployeeIdAndStatusInAndIdNot(employeeId, ACTIVE_STATUSES, transportOrderId)) {
            throw new BadRequestException("Driver is already assigned to another active transport order");
        }
    }

    private void validateVehicleStatus(Vehicle vehicle) {
        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new BadRequestException("Vehicle is not available for assignment");
        }
    }
}
