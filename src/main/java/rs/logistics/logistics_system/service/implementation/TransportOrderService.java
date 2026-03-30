package rs.logistics.logistics_system.service.implementation;

import java.time.LocalDateTime;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
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
import rs.logistics.logistics_system.service.definition.*;

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
    private static final List<TransportOrderStatus> SCHEDULE_BLOCKING_STATUSES = Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);

    private static final List<TransportOrderStatus> VEHICLE_BUSY_STATUSES = Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);

    private final ActivityLogServiceDefinition activityLogService;
    private final NotificationService notificationService;
    private final StockMovementServiceDefinition stockMovementService;
    private final ChangeHistoryServiceDefinition changeHistoryService;
    private final WarehouseInventoryServiceDefinition warehouseInventoryService;

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

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));

        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));

        User createdBy = _userRepository.findById(authenticatedUserProvider.getAuthenticatedUserId()).orElseThrow(() -> new ResourceNotFoundException("Created by not found"));

        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);
        validateVehicleForAssignment(vehicle);
        checkVehicleAvailability(vehicle.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime());
        checkDriverAvailability(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime());

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

        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        if (transportOrder.getStatus() == TransportOrderStatus.IN_TRANSIT || transportOrder.getStatus() == TransportOrderStatus.DELIVERED || transportOrder.getStatus() == TransportOrderStatus.CANCELLED) {
            throw new BadRequestException("Transport order cannot be updated in current status");
        }

        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            if (!dto.getSourceWarehouseId().equals(transportOrder.getSourceWarehouse().getId())) {
                throw new BadRequestException("Source warehouse cannot be changed once transport order is no longer in CREATED status");
            }

            if (!dto.getDestinationWarehouseId().equals(transportOrder.getDestinationWarehouse().getId())) {
                throw new BadRequestException("Destination warehouse cannot be changed once transport order is no longer in CREATED status");
            }
        }

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));

        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));

        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);

        if (!dto.getVehicleId().equals(transportOrder.getVehicle().getId())) {
            validateVehicleForAssignment(vehicle);
        }

        checkVehicleAvailabilityForUpdate(vehicle.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), transportOrder.getId());
        checkDriverAvailabilityForUpdate(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), transportOrder.getId());

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

        Vehicle previousVehicle = transportOrder.getVehicle();
        Employee previousEmployee = transportOrder.getAssignedEmployee();
        LocalDateTime previousDepartureTime = transportOrder.getDepartureTime();
        LocalDateTime previousPlannedArrivalTime = transportOrder.getPlannedArrivalTime();

        TransportOrderMapper.updateEntity(
                dto,
                transportOrder,
                warehouseSource,
                warehouseDestination,
                vehicle,
                assignedEmployee
        );

        TransportOrder updated = _transportOrderRepository.save(transportOrder);

        if (transportOrder.getStatus() == TransportOrderStatus.ASSIGNED) {
            if (!previousVehicle.getId().equals(updated.getVehicle().getId())) {
                markVehicleAsBusy(updated.getVehicle());
                refreshVehicleAvailability(previousVehicle.getId());
            } else {
                markVehicleAsBusy(updated.getVehicle());
            }
        }

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
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        TransportOrderStatus current = transportOrder.getStatus();

        validateStatusTransition(current, status);

        if (status == TransportOrderStatus.ASSIGNED) {
            validateVehicleForAssignment(transportOrder.getVehicle());
            validateAssignedEmployee(transportOrder.getAssignedEmployee());

            checkVehicleAvailabilityForUpdate(
                    transportOrder.getVehicle().getId(),
                    transportOrder.getDepartureTime(),
                    transportOrder.getPlannedArrivalTime(),
                    transportOrder.getId()
            );
            checkDriverAvailabilityForUpdate(
                    transportOrder.getAssignedEmployee().getId(),
                    transportOrder.getDepartureTime(),
                    transportOrder.getPlannedArrivalTime(),
                    transportOrder.getId()
            );

            reserveInventoryForOrder(transportOrder);

            markVehicleAsBusy(transportOrder.getVehicle());

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notificationService.createSystemNotification(
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport assigned",
                        "Transport order #" + transportOrder.getId() + " has been assigned to you.",
                        NotificationType.INFO
                );
            }
        }

        if (status == TransportOrderStatus.IN_TRANSIT) {
            if (transportOrder.getVehicle().getStatus() != VehicleStatus.IN_USE) {
                throw new BadRequestException("Vehicle must be in use before transport starts");
            }

            if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
                throw new BadRequestException("Transport order must contain at least one item before transport starts");
            }

            markVehicleAsBusy(transportOrder.getVehicle());

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notificationService.createSystemNotification(
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport started",
                        "Transport order #" + transportOrder.getId() + " is now in transit.",
                        NotificationType.INFO
                );
            }
        }

        if (status == TransportOrderStatus.DELIVERED) {
            executeDeliveryInventoryFlow(transportOrder);
            transportOrder.setActualArrivalTime(LocalDateTime.now());
            refreshVehicleAvailability(transportOrder.getVehicle().getId());

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notificationService.createSystemNotification(
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport delivered",
                        "Transport order #" + transportOrder.getId() + " has been successfully delivered.",
                        NotificationType.INFO
                );
            }

            if (transportOrder.getDestinationWarehouse() != null && transportOrder.getDestinationWarehouse().getManager() != null && transportOrder.getDestinationWarehouse().getManager().getUser() != null) {

                notificationService.createSystemNotification(
                        transportOrder.getDestinationWarehouse().getManager().getUser().getId(),
                        "Incoming transport delivered",
                        "Transport order #" + transportOrder.getId() + " has arrived at warehouse '" + transportOrder.getDestinationWarehouse().getName() + "'.",
                        NotificationType.INFO
                );
            }
        }

        if (status == TransportOrderStatus.CANCELLED) {
            if (current == TransportOrderStatus.ASSIGNED) {
                releaseInventoryForOrder(transportOrder);
            }

            if (current == TransportOrderStatus.IN_TRANSIT) {
                throw new BadRequestException("Transport order in transit cannot be cancelled");
            }

            refreshVehicleAvailability(transportOrder.getVehicle().getId());

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notificationService.createSystemNotification(
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport cancelled",
                        "Transport order #" + transportOrder.getId() + " has been cancelled.",
                        NotificationType.WARNING
                );
            }

            if (transportOrder.getSourceWarehouse() != null && transportOrder.getSourceWarehouse().getManager() != null && transportOrder.getSourceWarehouse().getManager().getUser() != null) {

                notificationService.createSystemNotification(
                        transportOrder.getSourceWarehouse().getManager().getUser().getId(),
                        "Transport cancelled",
                        "Transport order #" + transportOrder.getId() + " from warehouse '" +
                                transportOrder.getSourceWarehouse().getName() + "' has been cancelled.",
                        NotificationType.WARNING
                );
            }

            if (transportOrder.getDestinationWarehouse() != null && transportOrder.getDestinationWarehouse().getManager() != null && transportOrder.getDestinationWarehouse().getManager().getUser() != null) {

                notificationService.createSystemNotification(
                        transportOrder.getDestinationWarehouse().getManager().getUser().getId(),
                        "Transport cancelled",
                        "Transport order #" + transportOrder.getId() + " to warehouse '" + transportOrder.getDestinationWarehouse().getName() + "' has been cancelled.",
                        NotificationType.WARNING
                );
            }
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

    private void checkVehicleAvailability(Long vehicleId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime) {
        if (_transportOrderRepository.existsVehicleScheduleOverlap(
                vehicleId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime
        )) {
            throw new BadRequestException("Vehicle is not available in selected time range");
        }
    }

    private void checkDriverAvailability(Long employeeId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime) {
        if (_transportOrderRepository.existsDriverScheduleOverlap(
                employeeId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime
        )) {
            throw new BadRequestException("Driver is not available in selected time range");
        }
    }

    private void checkVehicleAvailabilityForUpdate(Long vehicleId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime, Long transportOrderId) {
        if (_transportOrderRepository.existsVehicleScheduleOverlapExcludingOrder(
                vehicleId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime,
                transportOrderId
        )) {
            throw new BadRequestException("Vehicle is not available in selected time range");
        }
    }

    private void checkDriverAvailabilityForUpdate(Long employeeId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime, Long transportOrderId) {
        if (_transportOrderRepository.existsDriverScheduleOverlapExcludingOrder(
                employeeId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime,
                transportOrderId
        )) {
            throw new BadRequestException("Driver is not available in selected time range");
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

    private void reserveInventoryForOrder(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one item before assignment");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            warehouseInventoryService.reserveStock(
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId(),
                    item.getQuantity()
            );
        }
    }

    private void releaseInventoryForOrder(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            return;
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            warehouseInventoryService.releaseReservedStock(
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId(),
                    item.getQuantity()
            );
        }
    }
    private void executeDeliveryInventoryFlow(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one item to complete delivery");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            stockMovementService.create(new StockMovementCreate(
                    StockMovementType.TRANSFER_OUT,
                    item.getQuantity(),
                    StockMovementReasonCode.TRANSPORT_DISPATCH,
                    "Transport order dispatched from source warehouse",
                    StockMovementReferenceType.TRANSPORT_ORDER,
                    transportOrder.getId(),
                    transportOrder.getOrderNumber(),
                    "Source warehouse transfer out",
                    transportOrder.getId(),
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId()
            ));
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            stockMovementService.create(new StockMovementCreate(
                    StockMovementType.TRANSFER_IN,
                    item.getQuantity(),
                    StockMovementReasonCode.TRANSPORT_RECEIPT,
                    "Transport order received at destination warehouse",
                    StockMovementReferenceType.TRANSPORT_ORDER,
                    transportOrder.getId(),
                    transportOrder.getOrderNumber(),
                    "Destination warehouse transfer in",
                    transportOrder.getId(),
                    transportOrder.getDestinationWarehouse().getId(),
                    item.getProduct().getId()
            ));
        }
    }

    private void validateTransportOrderItem(TransportOrderItem item) {
        if (item == null) {
            throw new BadRequestException("Transport order item is required");
        }

        if (item.getProduct() == null || item.getProduct().getId() == null) {
            throw new BadRequestException("Transport order item product is required");
        }

        if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transport order item quantity must be greater than 0");
        }
    }

    private void markVehicleAsBusy(Vehicle vehicle) {
        if (vehicle.getStatus() != VehicleStatus.IN_USE) {
            vehicle.setStatus(VehicleStatus.IN_USE);
            _vehicleRepository.save(vehicle);
        }
    }

    private void refreshVehicleAvailability(Long vehicleId) {
        Vehicle vehicle = _vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        boolean stillBusy = _transportOrderRepository.existsByVehicleIdAndStatusIn(
                vehicleId,
                VEHICLE_BUSY_STATUSES
        );

        vehicle.setStatus(stillBusy ? VehicleStatus.IN_USE : VehicleStatus.AVAILABLE);
        _vehicleRepository.save(vehicle);
    }
}