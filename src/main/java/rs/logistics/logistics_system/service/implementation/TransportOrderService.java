package rs.logistics.logistics_system.service.implementation;

import java.time.LocalDateTime;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.entity.*;
import rs.logistics.logistics_system.enums.*;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.repository.*;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
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

    private final AuthenticatedUserProvider authenticatedUserProvider;


    @Transactional
    @Override
    public TransportOrderResponse create(TransportOrderCreate dto) {

        if (dto.getVehicleId() == null ||
                dto.getAssignedEmployeeId() == null ||
                dto.getSourceWarehouseId() == null ||
                dto.getDestinationWarehouseId() == null ||
                authenticatedUserProvider.getAuthenticatedUserId() == null) {
            throw new BadRequestException("Invalid request");
        }

        if (dto.getTotalWeight() == null || dto.getTotalWeight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Total weight must be greater than 0");
        }

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));

        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));

        User createdBy = _userRepository.findById(authenticatedUserProvider.getAuthenticatedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Created by not found"));

        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);
        validateVehicleForAssignment(vehicle);

        if (vehicle.getCapacity() != null && dto.getTotalWeight().compareTo(vehicle.getCapacity()) > 0) {
            throw new BadRequestException("Total weight exceeds vehicle capacity");
        }

        TransportOrder transportOrder = TransportOrderMapper.toEntity(
                dto, warehouseSource, warehouseDestination, vehicle, assignedEmployee, createdBy
        );
        transportOrder.setStatus(TransportOrderStatus.CREATED);

        TransportOrder saved = _transportOrderRepository.save(transportOrder);

        activityLogService.create(new ActivityLogCreate(
                "CREATE",
                "TRANSPORT_ORDER",
                saved.getId(),
                "Transport order created (ID: " + saved.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TRANSPORT_ORDER",
                saved.getId(),
                ChangeType.CREATE,
                "ENTITY",
                "null",
                "CREATED",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return TransportOrderMapper.toResponse(saved);
    }

    @Transactional
    @Override
    public TransportOrderResponse update(Long id, TransportOrderUpdate dto) {

        if (dto.getVehicleId() == null ||
                dto.getAssignedEmployeeId() == null ||
                dto.getSourceWarehouseId() == null ||
                dto.getDestinationWarehouseId() == null ||
                authenticatedUserProvider.getAuthenticatedUserId() == null) {
            throw new BadRequestException("Invalid request");
        }

        if (dto.getTotalWeight() == null || dto.getTotalWeight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Total weight must be greater than 0");
        }

        TransportOrder transportOrder = _transportOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));

        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));

        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);
        validateVehicleForAssignment(vehicle);

        if (vehicle.getCapacity() != null && dto.getTotalWeight().compareTo(vehicle.getCapacity()) > 0) {
            throw new BadRequestException("Total weight exceeds vehicle capacity");
        }

        if (!dto.getAssignedEmployeeId().equals(transportOrder.getAssignedEmployee().getId())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TRANSPORT_ORDER",
                    transportOrder.getId(),
                    ChangeType.UPDATE,
                    "assignedEmployee",
                    transportOrder.getAssignedEmployee().getId().toString(),
                    dto.getAssignedEmployeeId().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if (!dto.getVehicleId().equals(transportOrder.getVehicle().getId())) {
            changeHistoryService.create(new ChangeHistoryCreate(
                    "TRANSPORT_ORDER",
                    transportOrder.getId(),
                    ChangeType.UPDATE,
                    "vehicle",
                    transportOrder.getVehicle().getId().toString(),
                    dto.getVehicleId().toString(),
                    authenticatedUserProvider.getAuthenticatedUserId()
            ));
        }

        if (transportOrder.getStatus() == TransportOrderStatus.ASSIGNED ||
                transportOrder.getStatus() == TransportOrderStatus.IN_TRANSIT) {
            checkVehicleAvailabilityForUpdate(vehicle.getId(), transportOrder.getId());
            checkDriverAvailabilityForUpdate(assignedEmployee.getId(), transportOrder.getId());
        }

        TransportOrderMapper.updateEntity(
                dto,
                transportOrder,
                warehouseSource,
                warehouseDestination,
                vehicle,
                assignedEmployee
        );

        TransportOrder updated = _transportOrderRepository.save(transportOrder);

        activityLogService.create(new ActivityLogCreate(
                "UPDATE",
                "TRANSPORT_ORDER",
                updated.getId(),
                "Transport order updated (ID: " + updated.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
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

    @Transactional
    @Override
    public void delete(Long id) {
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            throw new BadRequestException("Only transport orders in CREATED status can be deleted");
        }

        _transportOrderRepository.delete(transportOrder);

        activityLogService.create(new ActivityLogCreate(
                "DELETE",
                "TRANSPORT_ORDER",
                id,
                "Transport order deleted (ID: " + id + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TRANSPORT_ORDER",
                id,
                ChangeType.DELETE,
                "ENTITY",
                "CREATED",
                "null",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));
    }

    @Transactional
    @Override
    public TransportOrderResponse changeStatus(Long id, TransportOrderStatus status) {
        TransportOrder transportOrder = _transportOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        TransportOrderStatus current = transportOrder.getStatus();

        validateStatusTransition(current, status);

        if (status == TransportOrderStatus.ASSIGNED) {
            validateVehicleForAssignment(transportOrder.getVehicle());
            validateAssignedEmployee(transportOrder.getAssignedEmployee());

            checkVehicleAvailabilityForUpdate(
                    transportOrder.getVehicle().getId(),
                    transportOrder.getId()
            );
            checkDriverAvailabilityForUpdate(
                    transportOrder.getAssignedEmployee().getId(),
                    transportOrder.getId()
            );

            transportOrder.getVehicle().setStatus(VehicleStatus.IN_USE);
            _vehicleRepository.save(transportOrder.getVehicle());
        }

        if (status == TransportOrderStatus.IN_TRANSIT) {
            if (transportOrder.getVehicle().getStatus() != VehicleStatus.IN_USE) {
                throw new BadRequestException("Vehicle must be in use before transport starts");
            }
        }

        if (status == TransportOrderStatus.DELIVERED) {
            transportOrder.setActualArrivalTime(LocalDateTime.now());
            transportOrder.getVehicle().setStatus(VehicleStatus.AVAILABLE);
            _vehicleRepository.save(transportOrder.getVehicle());
        }

        if (status == TransportOrderStatus.CANCELLED) {
            transportOrder.getVehicle().setStatus(VehicleStatus.AVAILABLE);
            _vehicleRepository.save(transportOrder.getVehicle());
        }

        transportOrder.setStatus(status);

        TransportOrder saved = _transportOrderRepository.save(transportOrder);

        activityLogService.create(new ActivityLogCreate(
                "STATUS_CHANGED",
                "TRANSPORT_ORDER",
                saved.getId(),
                "Transport order status changed from " + current + " to " + saved.getStatus() + " (ID: " + saved.getId() + ")",
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        changeHistoryService.create(new ChangeHistoryCreate(
                "TRANSPORT_ORDER",
                saved.getId(),
                ChangeType.STATUS_CHANGE,
                "status",
                current.toString(),
                saved.getStatus().toString(),
                authenticatedUserProvider.getAuthenticatedUserId()
        ));

        return TransportOrderMapper.toResponse(saved);
    }

    // helpers

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

    private void validateWarehouses(Warehouse source, Warehouse destination) {
        if (source == null || destination == null) {
            throw new BadRequestException("Source and destination warehouses are required");
        }

        if (source.getId() == null || destination.getId() == null) {
            throw new BadRequestException("Warehouse IDs are required");
        }

        if (source.getId().equals(destination.getId())) {
            throw new BadRequestException("Source and destination warehouses must be different");
        }

        if (!Boolean.TRUE.equals(source.getActive())) {
            throw new BadRequestException("Source warehouse is not active");
        }

        if (!Boolean.TRUE.equals(destination.getActive())) {
            throw new BadRequestException("Destination warehouse is not active");
        }

        if (source.getStatus() != WarehouseStatus.ACTIVE) {
            throw new BadRequestException("Source warehouse is not available for transport operations");
        }

        if (destination.getStatus() != WarehouseStatus.ACTIVE) {
            throw new BadRequestException("Destination warehouse is not available for transport operations");
        }
    }

    private void validateAssignedEmployee(Employee employee) {
        if (employee == null) {
            throw new BadRequestException("Assigned employee is required");
        }

        if (employee.getId() == null) {
            throw new BadRequestException("Assigned employee ID is required");
        }

        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new BadRequestException("Assigned employee is not active");
        }

        if (employee.getPosition() != EmployeePosition.DRIVER) {
            throw new BadRequestException("Assigned employee must have DRIVER position");
        }
    }

    private void validateVehicleForAssignment(Vehicle vehicle) {
        if (vehicle == null) {
            throw new BadRequestException("Vehicle is required");
        }

        if (vehicle.getId() == null) {
            throw new BadRequestException("Vehicle ID is required");
        }

        if (!Boolean.TRUE.equals(vehicle.getActive())) {
            throw new BadRequestException("Vehicle is not active");
        }

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new BadRequestException("Vehicle is not available for assignment");
        }
    }

    private void validateSchedule(LocalDateTime departure, LocalDateTime arrival) {
        if (departure == null || arrival == null) {
            throw new BadRequestException("Departure time and planned arrival time are required");
        }

        if (!departure.isBefore(arrival)) {
            throw new BadRequestException("Departure time must be before planned arrival time");
        }
    }

    private void validateStatusTransition(TransportOrderStatus current, TransportOrderStatus next) {
        if (current == null || next == null) {
            throw new BadRequestException("Invalid transport order status transition");
        }

        switch (current) {
            case CREATED:
                if (next != TransportOrderStatus.ASSIGNED && next != TransportOrderStatus.CANCELLED) {
                    throw new BadRequestException("Transport order in CREATED status can only change to ASSIGNED or CANCELLED");
                }
                break;

            case ASSIGNED:
                if (next != TransportOrderStatus.IN_TRANSIT && next != TransportOrderStatus.CANCELLED) {
                    throw new BadRequestException("Transport order in ASSIGNED status can only change to IN_TRANSIT or CANCELLED");
                }
                break;

            case IN_TRANSIT:
                if (next != TransportOrderStatus.DELIVERED) {
                    throw new BadRequestException("Transport order in IN_TRANSIT status can only change to DELIVERED");
                }
                break;

            case DELIVERED:
            case CANCELLED:
                throw new BadRequestException("Transport order status cannot be changed anymore");

            default:
                throw new BadRequestException("Unsupported transport order status");
        }
    }
}
